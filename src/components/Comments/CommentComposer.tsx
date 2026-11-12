import { meetingProfile } from '../../services/meetingProfile'
import {
  useEffect, useId, useLayoutEffect, useRef, useState,
} from 'react'
import { useStore } from '@nanostores/react'
import { $me, refreshMe } from '../../stores/me'
import { comments, type Comment, type Mention, type Person } from '../../services/comments'
import { useTranslation } from '../../hooks/useTranslation'
import Button from '../Button/Button'
import Avatar from '../Avatar/Avatar'
import HostBadge from '../HostBadge/HostBadge'
import Input from '../Input/Input'
import { Dialog } from '../Dialog/Dialog'
import { auth } from '../../services/auth'
import { localeMeta } from '../../i18n/config'
import { mentionQuery, moveMentions } from './mentions'
import styles from './Comments.module.scss'
export default function CommentComposer ({
  code, people, initial, target, onSaved, onCancel,
}: {
  code: string
  people: Person[]
  initial?: Comment
  target?: Comment
  onSaved: (comment: Comment) => void
  onCancel?: () => void
}) {
  const { t, locale } = useTranslation()
  const me = useStore($me)
  const [body, setBody] = useState(initial?.body || '')
  const [mentions, setMentions] = useState<Mention[]>(initial?.mentions || [])
  const [caret, setCaret] = useState(0)
  const [suggesting, setSuggesting] = useState(false)
  const [selected, setSelected] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [nameDialogOpen, setNameDialogOpen] = useState(false)
  const [username, setUsername] = useState('')
  const saving = useRef(false)
  const request = useRef<{
    signature: string
    id: string
  } | null>(null)
  const input = useRef<HTMLTextAreaElement>(null)
  const highlight = useRef<HTMLDivElement>(null)
  const suggestions = useRef<HTMLDivElement>(null)
  const composer = useRef<HTMLDivElement>(null)
  const syncHighlight = () => {
    if (!input.current || !highlight.current) return
    const textarea = input.current
    highlight.current.style.width = `${textarea.clientWidth}px`
    highlight.current.style.marginLeft = `${textarea.clientLeft}px`
    highlight.current.style.transform = `translate(${-textarea.scrollLeft}px, ${-textarea.scrollTop}px)`
  }
  const id = useId()
  const pendingCaret = useRef<number | null>(null)
  useLayoutEffect(() => {
    const textarea = input.current
    if (!textarea) return
    let width = textarea.clientWidth
    const resize = () => {
      const top = textarea.scrollTop
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 240)}px`
      textarea.scrollTop = top
      syncHighlight()
    }
    resize()
    const observer = new ResizeObserver(() => {
      if (textarea.clientWidth !== width) {
        width = textarea.clientWidth
        resize()
      }
    })
    observer.observe(textarea)
    let active = true
    void document.fonts.ready.then(() => {
      if (active) resize()
    })
    return () => {
      active = false
      observer.disconnect()
    }
  }, [body, mentions.length])
  useEffect(() => {
    if (!initial && !target) return
    input.current?.focus({ preventScroll: true })
    const end = input.current?.value.length || 0
    input.current?.setSelectionRange(end, end)
    const frame = requestAnimationFrame(() => composer.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' }))
    return () => cancelAnimationFrame(frame)
  }, [initial?.id, target?.id])
  useLayoutEffect(() => {
    if (pendingCaret.current === null) return
    const position = pendingCaret.current
    pendingCaret.current = null
    input.current?.focus()
    input.current?.setSelectionRange(position, position)
  }, [body])
  const query = suggesting ? mentionQuery(body, caret) : null
  const matches = query ? people.filter(p => p.name.toLocaleLowerCase().includes(query.query.toLocaleLowerCase())).slice(0, 8) : []
  useLayoutEffect(() => {
    const popup = suggestions.current
    if (!query || !popup) return
    const place = () => {
      const rect = popup.parentElement!.getBoundingClientRect()
      const viewport = window.visualViewport
      const top = viewport?.offsetTop || 0
      const bottom = top + (viewport?.height || window.innerHeight)
      const above = Math.max(0, rect.top - Math.max(top, 90) - 8)
      const below = Math.max(0, bottom - rect.bottom - 8)
      const opensBelow = below >= Math.min(220, popup.scrollHeight) || below >= above
      popup.style.insetBlockStart = opensBelow ? 'calc(100% + 4px)' : 'auto'
      popup.style.insetBlockEnd = opensBelow ? 'auto' : 'calc(100% + 4px)'
      popup.style.maxHeight = `${Math.max(44, Math.min(220, opensBelow ? below : above))}px`
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    window.visualViewport?.addEventListener('resize', place)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
      window.visualViewport?.removeEventListener('resize', place)
    }
  }, [!!query, matches.length, body])
  const choose = (person: Person) => {
    if (!query)
      return
    const token = `@${person.name}`
    const next = body.slice(0, query.start) + token + ' ' + body.slice(query.end)
    if (next.length > 1000)
      return
    const moved = moveMentions(body, next, mentions)
    setMentions([...moved, { userId: person.id, start: query.start, end: query.start + token.length }].sort((a, b) => a.start - b.start))
    pendingCaret.current = query.start + token.length + 1
    setBody(next)
    setSuggesting(false)
  }
  const save = async (name?: string) => {
    if (saving.current || !body.trim() || $me.get() === undefined) return
    if (!$me.get() && !name?.trim()) {
      setError('')
      setNameDialogOpen(true)
      return
    }
    saving.current = true
    setBusy(true)
    setError('')
    const signature = JSON.stringify({ body, mentions, replyToId: target?.id })
    if (request.current?.signature !== signature)
      request.current = { signature, id: crypto.randomUUID() }
    try {
      if (!$me.get()) {
        await auth.anonymous.post(name!.trim())
        await refreshMe()
        if (!$me.get()) throw new Error('Session unavailable')
      }
      if (name?.trim()) await meetingProfile.put(code, name.trim())
      const saved = await comments.save(code, { body, mentions, replyToId: target?.id, requestId: request.current.id }, initial?.id)
      setBody('')
      setMentions([])
      request.current = null
      setNameDialogOpen(false)
      onSaved(saved)
    } catch (e) {
      const status = (e as {
        response?: {
          status: number
        }
      }).response?.status
      setError(t(status === 429 ? 'comments.rateLimit' : 'comments.failed'))
    } finally {
      saving.current = false
      setBusy(false)
    }
  }
  let offset = 0
  const highlighted = mentions.flatMap((mention, index) => {
    const before = body.slice(offset, mention.start)
    offset = mention.end
    return [before, <mark key={index}>{body.slice(mention.start, mention.end)}</mark>]
  })
  highlighted.push(body.slice(offset))
  const label = target ? t('comments.replyTo', { name: target.author.name }) : t(initial ? 'comments.edit' : 'comments.placeholder')
  return (
    <div ref={composer} data-comment-composer className={`${styles.composer} ${target || initial ? styles.inlineComposer : ''}`}>
      {target && <p className={styles.replyContext}>{label}</p>}
      <label className={styles.srOnly} htmlFor={id}>{label}</label>
      <div className={styles.inputWrap}>
        {query && (
          <div ref={suggestions} className={styles.suggestions} id={`${id}-people`} role='listbox' aria-label={t('comments.mention')}>
            {matches.length
              ? matches.map((p, index) => (
                  <button key={p.id} id={`${id}-person-${index}`} type='button' role='option' aria-selected={index === selected} onMouseDown={e => e.preventDefault()} onClick={() => choose(p)}>
                    <Avatar src={p.avatar} name={p.name} size={28} />
                    <span><bdi>{p.name}</bdi> {p.host ? <HostBadge label={t('comments.host')} /> : <small>#{p.id.slice(-6)}</small>}</span>
                  </button>
                ))
              : <p>{t('comments.noPeople')}</p>}
          </div>
        )}
        <div className={styles.textareaShell}>
          {mentions.length > 0 && (
            <div className={styles.highlightViewport} aria-hidden='true'>
              <div ref={highlight} dir='auto' className={styles.highlightText}>{highlighted}{'\u200b'}</div>
            </div>
          )}
          <textarea
            dir='auto'
            className={mentions.length ? styles.richInput : undefined}
            onScroll={syncHighlight}
            ref={input}
            id={id}
            value={body}
            maxLength={1000}
            rows={2}
            placeholder={!target && !initial ? t('comments.placeholder') : undefined}
            disabled={busy}
            aria-describedby={`${id}-count`}
            aria-controls={query ? `${id}-people` : undefined}
            aria-autocomplete='list'
            aria-activedescendant={query && matches[selected] ? `${id}-person-${selected}` : undefined}
            onChange={(e) => {
              const next = e.target.value
              setMentions(moveMentions(body, next, mentions))
              setBody(next)
              setCaret(e.target.selectionStart)
              setSuggesting(true)
              setSelected(0)
            }}
            onClick={(e) => {
              setCaret(e.currentTarget.selectionStart)
              setSuggesting(true)
            }}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing || !query)
                return
              if (e.key === 'Escape') {
                e.preventDefault()
                setSuggesting(false)
              }
              if (matches.length && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
                e.preventDefault()
                setSelected((selected + (e.key === 'ArrowDown' ? 1 : matches.length - 1)) % matches.length)
              }
              if (e.key === 'Enter' && matches[selected]) {
                e.preventDefault()
                choose(matches[selected])
              }
            }}
          />
        </div>
        <div className={styles.composerFooter}>
          <span className={styles.counter} id={`${id}-count`} dir='ltr'>{body.length}/1000</span>
          <div className={styles.actions}>
            {onCancel && <Button buttonType='ghost' disabled={busy} onClick={onCancel}>{t('common.cancel')}</Button>}
            <Button buttonType='primary' disabled={me === undefined || !body.trim() || busy} onClick={() => save()}>
              {t(initial ? 'comments.save' : 'comments.post')}
            </Button>
          </div>
        </div>
      </div>
      <Dialog.Root open={nameDialogOpen} onOpenChange={(open) => { if (!saving.current) setNameDialogOpen(open) }}>
        <Dialog.Content
          dir={localeMeta[locale].dir}
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            document.getElementById(`${id}-name`)?.focus()
          }}
        >
          <Dialog.Title>{t('comments.post')}</Dialog.Title>
          <Dialog.Description>{t('comments.session')}</Dialog.Description>
          <form
            className={styles.login}
            onSubmit={(event) => {
              event.preventDefault()
              void save(username)
            }}
          >
            <label htmlFor={`${id}-name`}>{t('meeting.anonymous.usernamePlaceholder')}</label>
            <Input id={`${id}-name`} dir='auto' autoComplete='nickname' maxLength={100} value={username} disabled={busy} onChange={event => setUsername(event.target.value)} />
            {error && <p role='alert' className={styles.error}>{error}</p>}
            <div className={styles.actions}>
              <Dialog.Cancel type='button' disabled={busy}>{t('common.cancel')}</Dialog.Cancel>
              <Button type='submit' buttonType='primary' disabled={!username.trim() || busy}>{t('comments.post')}</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Root>
      {error && !nameDialogOpen && <p role='alert' className={styles.error}>{error}</p>}
    </div>
  )
}

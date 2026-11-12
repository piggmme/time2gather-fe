import { meetingProfileChanged } from '../../services/meetingProfile'
import { reloadVisibleComments } from '../../utils/commentPages'
import { meetingShareUrl } from '../../utils/share'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from '@nanostores/react'
import { ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons'
import { $me } from '../../stores/me'
import {
  comments, type Activity, type Comment, type CommentPage, type Person, type Summary,
} from '../../services/comments'
import { useTranslation } from '../../hooks/useTranslation'
import { intlLocale, localeMeta } from '../../i18n'
import Button from '../Button/Button'
import Avatar from '../Avatar/Avatar'
import HostBadge from '../HostBadge/HostBadge'
import { Dialog } from '../Dialog/Dialog'
import CommentComposer from './CommentComposer'
import CommentReactions from './CommentReactions'
import styles from './Comments.module.scss'
const unique = (items: Comment[]) => [...new Map(items.map(c => [c.id, c])).values()]
const emptyPage: CommentPage = { items: [], nextCursor: null }
export default function Comments ({ code, onSummary }: {
  code: string
  onSummary?: (count: number, hasNew: boolean) => void
}) {
  const { t, locale } = useTranslation()
  const me = useStore($me)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [roots, setRoots] = useState<CommentPage>(emptyPage)
  const [replies, setReplies] = useState<Record<string, CommentPage>>({})
  const [expanded, setExpanded] = useState<string[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [activity, setActivity] = useState<Activity[]>([])
  const [editor, setEditor] = useState<{
    comment: Comment
    edit: boolean
  } | null>(null)
  const [removing, setRemoving] = useState<{
    comment: Comment
    hide: boolean
  } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [attempt, setAttempt] = useState(0)
  const section = useRef<HTMLElement>(null)
  const seen = useRef(0)
  const version = useRef(-1)
  const namesVersion = useRef(-1)
  const visible = useRef({ roots, replies, expanded, editor })
  visible.current = { roots, replies, expanded, editor }
  const storageKey = useRef('')
  const jump = useCallback(async (id: string) => {
    const target = await comments.one(code, id)
    const root = target.rootId ? await comments.one(code, target.rootId) : target
    setRoots(p => ({ ...p, items: unique([root, ...p.items.filter(c => c.id !== root.id)]) }))
    if (target.rootId) {
      const page = await comments.list(code, target.rootId)
      setReplies(p => ({ ...p, [target.rootId!]: { ...page, items: unique([...page.items, target]).sort((a, b) => a.createdAt - b.createdAt) } }))
      setExpanded(p => [...new Set([...p, target.rootId!])])
    }
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const node = document.getElementById(`comment-${id}`)
      node?.scrollIntoView({ block: 'center', behavior: 'auto' })
      node?.focus({ preventScroll: true })
    }))
  }, [code])
  useEffect(() => {
    if (me === undefined)
      return
    let disposed = false
    let inFlight = false
    setLoading(true)
    setError('')
    version.current = -1
    namesVersion.current = -1
    const poll = async (initial = false) => {
      if (inFlight || (!initial && document.visibilityState === 'hidden'))
        return
      inFlight = true
      try {
        const next = await comments.summary(code)
        if (disposed)
          return
        if (initial) {
          storageKey.current = `comments-seen:${code}:${next.viewerId || 'guest'}`
          try {
            const stored = localStorage.getItem(storageKey.current)
            const parsed = stored === null ? NaN : Number(stored)
            seen.current = Number.isFinite(parsed) && parsed >= 0 ? parsed : next.version
          } catch {
            seen.current = next.version
          }
          const [page, candidates] = await Promise.all([comments.list(code), comments.people(code)])
          if (disposed)
            return
          setRoots(page)
          setPeople(candidates)
          try {
            if (localStorage.getItem(storageKey.current) === null)
              localStorage.setItem(storageKey.current, String(seen.current))
          } catch { /* Browsers may disable persistent storage. */ }
        }
        if (version.current !== next.version || namesVersion.current !== (next.namesVersion ?? 0)) {
          if (!initial) {
            const current = visible.current
            const editing = current.editor?.comment
            const [page,
              entries,
              candidates] = await Promise.all([
              reloadVisibleComments(cursor => comments.list(code, undefined, cursor), current.roots.items.length,
                [...current.expanded, ...(editing ? [editing.rootId || editing.id] : [])], id => comments.one(code, id)),
              Promise.all(current.expanded.map(async id => [id, await reloadVisibleComments(
                cursor => comments.list(code, id, cursor), current.replies[id]?.items.length || 0,
                editing?.rootId === id ? [editing.id] : [], commentId => comments.one(code, commentId),
              )] as const)),
              comments.people(code),
            ])
            if (disposed) return
            setRoots(page)
            setReplies(previous => ({ ...previous, ...Object.fromEntries(entries) }))
            setPeople(candidates)
          }
          namesVersion.current = next.namesVersion ?? 0
        }
        if (version.current !== next.version) {
          const fresh = await comments.activity(code, seen.current)
          if (disposed)
            return
          setActivity(fresh)
          version.current = next.version
        }
        setSummary(next)
        if (initial && location.hash.startsWith('#comment-'))
          await jump(location.hash.slice(9))
        setError('')
      } catch {
        if (!disposed)
          setError(t('comments.failed'))
      } finally {
        inFlight = false
        if (!disposed)
          setLoading(false)
      }
    }
    const profileChanged = (event: Event) => {
      if ((event as CustomEvent<{ code: string }>).detail.code === code) void poll()
    }
    window.addEventListener(meetingProfileChanged, profileChanged)
    void poll(true)
    const timer = window.setInterval(() => {
      void poll()
    }, 5000)
    const focus = () => {
      void poll()
    }
    const hash = () => {
      if (location.hash.startsWith('#comment-'))
        void jump(location.hash.slice(9)).catch(() => setError(t('comments.failed')))
    }
    window.addEventListener('focus', focus)
    window.addEventListener('hashchange', hash)
    document.addEventListener('visibilitychange', focus)
    return () => {
      disposed = true
      window.removeEventListener(meetingProfileChanged, profileChanged)
      window.clearInterval(timer)
      window.removeEventListener('focus', focus)
      window.removeEventListener('hashchange', hash)
      document.removeEventListener('visibilitychange', focus)
    }
    // Translations are read on initialization; locale changes must not discard drafts or pagination.
  }, [code, me?.userId, me === undefined, attempt, jump])
  useEffect(() => {
    if (!summary || activity.length === 0)
      return
    const observedVersion = summary.version
    let remaining = activity
    let disposed = false
    // Only acknowledge comments that are actually visible, including opened replies.
    const observer = new IntersectionObserver((entries) => {
      if (disposed || document.visibilityState !== 'visible' || version.current !== observedVersion)
        return
      const read = new Set(entries.filter(entry => entry.isIntersecting && entry.intersectionRatio >= 0.25)
        .map(entry => entry.target.id.slice('comment-'.length)))
      if (!remaining.some(item => read.has(item.id)))
        return
      remaining = remaining.filter(item => !read.has(item.id))
      setActivity(remaining)
      if (remaining.length === 0) {
        seen.current = observedVersion
        try {
          localStorage.setItem(storageKey.current, String(observedVersion))
        } catch { /* In-memory marker still works. */ }
      }
    }, { threshold: 0.25 })
    const observe = () => {
      observer.disconnect()
      if (document.visibilityState !== 'visible')
        return
      for (const item of remaining) {
        const node = document.getElementById(`comment-${item.id}`)
        if (node && section.current?.contains(node)) observer.observe(node)
      }
    }
    observe()
    document.addEventListener('visibilitychange', observe)
    return () => {
      disposed = true
      observer.disconnect()
      document.removeEventListener('visibilitychange', observe)
    }
  }, [summary, activity, roots, replies, expanded])
  useEffect(() => {
    onSummary?.(summary?.count || 0, activity.length > 0)
  }, [summary?.count, activity.length, onSummary])
  const run = async (action: () => Promise<void>) => {
    if (busy)
      return
    setBusy(true)
    setError('')
    try {
      await action()
    } catch {
      setError(t('comments.failed'))
    } finally {
      setBusy(false)
    }
  }
  const refresh = async () => {
    // Read the version first. Writes during these reads remain unseen for the next poll.
    const next = await comments.summary(code)
    const page = await comments.list(code)
    const entries = await Promise.all(expanded.map(async id => [id, await comments.list(code, id)] as const))
    setRoots(page)
    setReplies(Object.fromEntries(entries))
    setSummary(next)
    setPeople(await comments.people(code))
    setActivity([])
    seen.current = next.version
    version.current = next.version
    try {
      localStorage.setItem(storageKey.current, String(next.version))
    } catch { /* In-memory marker still works. */ }
  }
  const saved = (comment: Comment) => {
    setEditor(null)
    if (!comment.rootId)
      setRoots(p => ({ ...p, items: unique([comment, ...p.items.filter(c => c.id !== comment.id)]).sort((a, b) => b.createdAt - a.createdAt) }))
    else {
      setReplies(p => ({ ...p, [comment.rootId!]: { ...(p[comment.rootId!] || emptyPage), items: unique([...(p[comment.rootId!]?.items || []), comment]).sort((a, b) => a.createdAt - b.createdAt) } }))
      setExpanded(p => [...new Set([...p, comment.rootId!])])
    }
    void run(async () => {
      if (comment.rootId) {
        const root = await comments.one(code, comment.rootId)
        setRoots(p => ({ ...p, items: p.items.map(c => c.id === root.id ? root : c) }))
        const page = await comments.list(code, comment.rootId)
        setReplies(p => ({ ...p, [comment.rootId!]: { ...page, items: unique([...page.items, comment]).sort((a, b) => a.createdAt - b.createdAt) } }))
      }
      setSummary(await comments.summary(code))
      setPeople(await comments.people(code))
    })
  }
  const toggleReplies = (id: string) => run(async () => {
    if (expanded.includes(id))
      setExpanded(p => p.filter(v => v !== id))
    else {
      const page = await comments.list(code, id)
      setReplies(p => ({ ...p, [id]: page }))
      setExpanded(p => [...p, id])
    }
  })
  const reactionSaved = (comment: Comment) => {
    setRoots(page => ({ ...page, items: page.items.map(item => item.id === comment.id ? comment : item) }))
    setReplies(pages => Object.fromEntries(Object.entries(pages).map(([id, page]) => [
      id, { ...page, items: page.items.map(item => item.id === comment.id ? comment : item) },
    ])))
  }
  const renderBody = (comment: Comment) => {
    let offset = 0
    const parts = comment.mentions.flatMap((m, index) => {
      const before = comment.body.slice(offset, m.start)
      offset = m.end
      return [before, <mark key={index}><bdi>{comment.body.slice(m.start, m.end)}</bdi></mark>]
    })
    return [...parts, comment.body.slice(offset)]
  }
  const renderComment = (comment: Comment) => (
    <article key={comment.id} id={`comment-${comment.id}`} tabIndex={-1} className={styles.comment}>
      <div className={styles.commentHeader}>
        <Avatar src={comment.author?.avatar} name={comment.author?.name || ''} size={32} />
        <div className={styles.author}>
          <bdi>{comment.author?.name}</bdi>
          {comment.author?.host && <HostBadge label={t('comments.host')} />}
          <time dateTime={new Date(comment.createdAt).toISOString()}>{new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: 'medium', timeStyle: 'short' }).format(comment.createdAt)}</time>
          {comment.edited && <span>{t('comments.edited')}</span>}
        </div>
        <details
          className={styles.menu}
          onClick={(event) => {
            if ((event.target as HTMLElement).closest('button')) event.currentTarget.open = false
          }}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) event.currentTarget.open = false
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.currentTarget.open = false
              event.currentTarget.querySelector('summary')?.focus()
            }
          }}
        >
          <summary aria-label={t('comments.actions')}>•••</summary>
          <div>
            <Button
              buttonType='ghost'
              onClick={() => run(async () => {
                const url = meetingShareUrl(code, location.origin)
                url.hash = `comment-${comment.id}`
                await navigator.clipboard.writeText(url.toString())
                setNotice(t('comments.copied'))
              })}
            >{t('comments.copy')}
            </Button>
            {comment.canEdit && <Button buttonType='ghost' onClick={() => setEditor({ comment, edit: true })}>{t('comments.edit')}</Button>}
            {comment.canDelete && <Button buttonType='ghost' onClick={() => setRemoving({ comment, hide: false })}>{t('comments.delete')}</Button>}
            {comment.canHide && <Button buttonType='ghost' onClick={() => setRemoving({ comment, hide: true })}>{t('comments.hide')}</Button>}
          </div>
        </details>
      </div>
      {comment.status === 'ACTIVE'
        ? <>{comment.replyTo && <p className={styles.meta}>{t('comments.replyTo', { name: comment.replyTo.name })}</p>}<p className={styles.body} dir='auto'>{renderBody(comment)}</p></>
        : <p className={styles.meta}>{t(comment.status === 'HIDDEN' ? 'comments.hidden' : 'comments.deleted')}</p>}
      {((comment.status === 'ACTIVE' && editor?.comment.id !== comment.id)
        || (!comment.rootId && (comment.replyCount > 0 || expanded.includes(comment.id)))) && (
        <div className={styles.commentActions}>
          {!comment.rootId && (
            <div className={styles.replyActions}>
              {comment.status === 'ACTIVE' && editor?.comment.id !== comment.id && (
                <Button
                  data-reply-trigger
                  buttonType='ghost'
                  onClick={() => {
                    setEditor({ comment, edit: false })
                  }}
                >{t('comments.reply')}
                </Button>
              )}
              {!comment.rootId && (comment.replyCount > 0 || expanded.includes(comment.id)) && (
                <button
                  type='button'
                  className={styles.repliesToggle}
                  disabled={busy}
                  aria-expanded={expanded.includes(comment.id)}
                  aria-controls={`comment-replies-${comment.id}`}
                  onClick={() => toggleReplies(comment.id)}
                >
                  <span>{t(expanded.includes(comment.id) ? 'comments.collapse' : 'comments.replies', { count: comment.replyCount })}</span>
                  {expanded.includes(comment.id) ? <ChevronUpIcon aria-hidden='true' /> : <ChevronDownIcon aria-hidden='true' />}
                  {activity.some(a => a.rootId === comment.id) && <span className={styles.badge}>{t('comments.newReply')}</span>}
                </button>
              )}
            </div>
          )}
          {comment.status === 'ACTIVE' && editor?.comment.id !== comment.id && (
            <CommentReactions code={code} comment={comment} viewerId={summary?.viewerId} onChanged={reactionSaved} />
          )}
        </div>
      )}
      {editor?.comment.id === comment.id && (
        <CommentComposer
          key={`${comment.id}-${editor.edit}`}
          code={code}
          people={people}
          initial={editor.edit ? comment : undefined}
          target={editor.edit ? undefined : comment}
          onSaved={saved}
          onCancel={() => {
            setEditor(null)
            requestAnimationFrame(() => {
              const article = document.getElementById(`comment-${comment.id}`)
              const trigger = article?.querySelector<HTMLElement>(editor.edit ? 'summary' : '[data-reply-trigger]')
              trigger?.focus({ preventScroll: true })
            })
          }}
        />
      )}
    </article>
  )
  return (
    <section ref={section} id='comments' className={styles.section} dir={localeMeta[locale].dir} aria-labelledby='comments-title'>
      <h2 id='comments-title'>{t('comments.title')} <span>{summary?.count || 0}</span></h2>
      {activity.some(a => a.mentioned) && (
        <div className={styles.newActivity}>
          {activity.filter(a => a.mentioned).map(a => <Button key={a.id} buttonType='ghost' disabled={busy} onClick={() => run(() => jump(a.id))}>{t('comments.mentioned')}</Button>)}
        </div>
      )}
      <CommentComposer code={code} people={people} onSaved={saved} />
      {notice && <p role='status'>{notice}</p>}
      {error && <div role='alert'><p className={styles.error}>{error}</p><Button disabled={busy} onClick={() => setAttempt(a => a + 1)}>{t('comments.retry')}</Button></div>}
      {loading && <p role='status'>{t('common.loading')}</p>}
      {roots.items.map(root => (
        <div key={root.id} className={styles.thread}>
          {renderComment(root)}
          {expanded.includes(root.id) && (
            <div id={`comment-replies-${root.id}`} className={styles.replies}>
              {replies[root.id]?.items.map(renderComment)}
              {replies[root.id]?.nextCursor && (
                <Button
                  disabled={busy}
                  onClick={() => run(async () => {
                    const page = await comments.list(code, root.id, replies[root.id].nextCursor!)
                    setReplies(p => ({ ...p, [root.id]: { ...page, items: unique([...p[root.id].items, ...page.items]).sort((a, b) => a.createdAt - b.createdAt) } }))
                  })}
                >{t('comments.moreReplies')}
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
      {roots.nextCursor && (
        <Button
          disabled={busy}
          onClick={() => run(async () => {
            const page = await comments.list(code, undefined, roots.nextCursor!)
            setRoots(p => ({ ...page, items: unique([...p.items, ...page.items]) }))
          })}
        >{t('comments.more')}
        </Button>
      )}
      <Dialog.Root
        open={!!removing}
        onOpenChange={(open) => {
          if (!open && !busy)
            setRemoving(null)
        }}
      >
        <Dialog.Content>
          <Dialog.Title>{t(removing?.hide ? 'comments.hide' : 'comments.delete')}</Dialog.Title>
          <Dialog.Description>{t('comments.removeConfirm')}</Dialog.Description>
          <Dialog.Cancel disabled={busy}>{t('common.cancel')}</Dialog.Cancel>
          <Button
            buttonType='primary'
            disabled={busy}
            onClick={() => run(async () => {
              if (!removing)
                return
              await comments.remove(code, removing.comment.id, removing.hide)
              setRemoving(null)
              await refresh()
            })}
          >{t(removing?.hide ? 'comments.hide' : 'comments.delete')}
          </Button>
        </Dialog.Content>
      </Dialog.Root>
    </section>
  )
}

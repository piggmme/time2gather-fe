import { useId, useRef, useState } from 'react'
import { useStore } from '@nanostores/react'
import { Dialog as PeopleDialog, DropdownMenu } from 'radix-ui'
import { HiOutlineEmojiHappy, HiOutlineUsers, HiX } from 'react-icons/hi'
import { CheckIcon } from '@radix-ui/react-icons'
import { $me, refreshMe } from '../../stores/me'
import { auth } from '../../services/auth'
import { meetingProfile } from '../../services/meetingProfile'
import { comments, commentReactions, type Comment, type ReactionEmoji } from '../../services/comments'
import { useTranslation } from '../../hooks/useTranslation'
import { localeMeta } from '../../i18n/config'
import Avatar from '../Avatar/Avatar'
import HostBadge from '../HostBadge/HostBadge'
import Button from '../Button/Button'
import Input from '../Input/Input'
import { Dialog } from '../Dialog/Dialog'
import dialogStyles from '../Dialog/Dialog.module.scss'
import styles from './CommentReactions.module.scss'

export default function CommentReactions ({ code, comment, viewerId, onChanged }: {
  code: string
  comment: Comment
  viewerId: string | null | undefined
  onChanged: (comment: Comment) => void
}) {
  const { t, locale } = useTranslation()
  const me = useStore($me)
  const reactions = comment.reactions || []
  const [pickerOpen, setPickerOpen] = useState(false)
  const [peopleOpen, setPeopleOpen] = useState(false)
  const [selected, setSelected] = useState<ReactionEmoji>('👍')
  const [pending, setPending] = useState<{ emoji: ReactionEmoji, active: boolean } | null>(null)
  const [username, setUsername] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const saving = useRef(false)
  const id = useId()
  const origin = useRef<HTMLElement | null>(null)
  const addTrigger = useRef<HTMLButtonElement>(null)
  const peopleTrigger = useRef<HTMLButtonElement>(null)
  const label = (emoji: ReactionEmoji) => t(`comments.reactions.${commentReactions.find(item => item.emoji === emoji)!.label}`)
  const count = (value: number) => new Intl.NumberFormat(locale).format(value)
  const change = async (emoji: ReactionEmoji, active: boolean, name?: string) => {
    if (saving.current || $me.get() === undefined) return
    setError('')
    if (!$me.get() && !name?.trim()) {
      setPending({ emoji, active })
      return
    }
    saving.current = true
    setBusy(true)
    try {
      if (!$me.get()) {
        await auth.anonymous.post(name!.trim())
        await refreshMe()
        if (!$me.get()) throw new Error('Session unavailable')
      }
      if (name?.trim()) await meetingProfile.put(code, name.trim())
      const updated = await comments.react(code, comment.id, emoji, active)
      setPending(null)
      onChanged(updated)
    } catch {
      setError(t('comments.reactions.failed'))
    } finally {
      saving.current = false
      setBusy(false)
    }
  }
  const choose = (emoji: ReactionEmoji, fromPicker = false) => {
    origin.current = fromPicker ? addTrigger.current : document.activeElement instanceof HTMLElement ? document.activeElement : null
    void change(emoji, !reactions.find(reaction => reaction.emoji === emoji)?.reacted)
  }
  const selectedReaction = reactions.find(reaction => reaction.emoji === selected) || reactions[0]
  const roster = selectedReaction?.people || []
  return (
    <>
      <div className={styles.bar} aria-busy={busy} data-comment-reactions>
        {reactions.map(reaction => (
          <button
            key={reaction.emoji}
            type='button'
            className={styles.chip}
            aria-pressed={reaction.reacted}
            aria-label={`${reaction.emoji} ${label(reaction.emoji)} (${count(reaction.count)})`}
            title={t(reaction.reacted ? 'comments.reactions.remove' : 'comments.reactions.react')}
            disabled={busy || me === undefined}
            onClick={() => choose(reaction.emoji)}
          >
            <span className={styles.emoji} aria-hidden='true'>{reaction.emoji}</span>
            <span>{count(reaction.count)}</span>
            {reaction.reacted && <CheckIcon aria-hidden='true' />}
          </button>
        ))}
        <div className={styles.tools}>
          <DropdownMenu.Root open={pickerOpen} onOpenChange={setPickerOpen} dir={localeMeta[locale].dir}>
            <DropdownMenu.Trigger asChild>
              <button ref={addTrigger} type='button' className={styles.iconButton} aria-label={t('comments.reactions.add')} title={t('comments.reactions.add')} disabled={busy || me === undefined}>
                <HiOutlineEmojiHappy aria-hidden='true' /><span aria-hidden='true' className={styles.plus}>+</span>
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className={styles.picker} sideOffset={4} collisionPadding={12} aria-label={t('comments.reactions.add')}>
                {commentReactions.map(item => (
                  <DropdownMenu.CheckboxItem key={item.emoji} className={styles.option} checked={!!reactions.find(r => r.emoji === item.emoji)?.reacted} onSelect={() => choose(item.emoji, true)} aria-label={label(item.emoji)}>
                    <span className={styles.emoji} aria-hidden='true'>{item.emoji}</span>
                    <DropdownMenu.ItemIndicator className={styles.indicator}><CheckIcon aria-hidden='true' /></DropdownMenu.ItemIndicator>
                  </DropdownMenu.CheckboxItem>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
          {(reactions.length > 0 || peopleOpen) && (
            <PeopleDialog.Root open={peopleOpen} onOpenChange={setPeopleOpen}>
              <PeopleDialog.Trigger asChild>
                <button ref={peopleTrigger} type='button' className={styles.iconButton} aria-label={t('comments.reactions.view')} title={t('comments.reactions.view')} onClick={() => setSelected(reactions[0]?.emoji || '👍')}><HiOutlineUsers aria-hidden='true' /></button>
              </PeopleDialog.Trigger>
              <PeopleDialog.Portal>
                <PeopleDialog.Overlay className={dialogStyles.Overlay} />
                <PeopleDialog.Content
                  className={`${dialogStyles.Content} ${styles.peopleDialog}`}
                  dir={localeMeta[locale].dir}
                  aria-describedby={undefined}
                  onCloseAutoFocus={(event) => {
                    if (!peopleTrigger.current?.isConnected && addTrigger.current) {
                      event.preventDefault()
                      addTrigger.current.focus({ preventScroll: true })
                    }
                  }}
                >
                  <div className={styles.dialogHeader}>
                    <PeopleDialog.Title className={dialogStyles.Title}>{t('comments.reactions.title')}</PeopleDialog.Title>
                    <PeopleDialog.Close asChild><button type='button' className={styles.iconButton} aria-label={t('common.close')}><HiX aria-hidden='true' /></button></PeopleDialog.Close>
                  </div>
                  <div className={styles.filters} role='group' aria-label={t('comments.reactions.title')}>
                    {commentReactions.filter(item => reactions.some(r => r.emoji === item.emoji)).map(item => (
                      <button key={item.emoji} type='button' className={styles.chip} aria-pressed={selectedReaction?.emoji === item.emoji} aria-label={label(item.emoji)} onClick={() => setSelected(item.emoji)}>
                        <span className={styles.emoji} aria-hidden='true'>{item.emoji}</span><span>{count(reactions.find(r => r.emoji === item.emoji)!.count)}</span>
                        {selectedReaction?.emoji === item.emoji && <CheckIcon aria-hidden='true' />}
                      </button>
                    ))}
                  </div>
                  <div aria-live='polite'>
                    {roster.length === 0 && <p className={styles.empty}>{t('comments.reactions.empty')}</p>}
                    <ul className={styles.people}>
                      {roster.map(person => (
                        <li key={person.id}>
                          <Avatar src={person.avatar} name={person.name} size={36} />
                          <div>
                            <bdi>{person.name}</bdi>
                            <small>
                              {person.id === viewerId && <span>{t('comments.reactions.you')}</span>}
                              {person.host && <HostBadge label={t('comments.host')} />}
                              {roster.some(other => other.id !== person.id && other.name === person.name) && <bdi dir='ltr'>#{person.id.slice(-6)}</bdi>}
                            </small>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </PeopleDialog.Content>
              </PeopleDialog.Portal>
            </PeopleDialog.Root>
          )}
        </div>
      </div>
      <Dialog.Root open={!!pending} onOpenChange={(open) => { if (!open && !saving.current) setPending(null) }}>
        <Dialog.Content
          dir={localeMeta[locale].dir}
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            document.getElementById(`${id}-name`)?.focus()
          }}
          onCloseAutoFocus={(event) => {
            const button = origin.current?.isConnected ? origin.current : addTrigger.current
            if (button) {
              event.preventDefault()
              button.focus({ preventScroll: true })
            }
          }}
        >
          <Dialog.Title>{t('comments.reactions.add')}</Dialog.Title>
          <Dialog.Description>{t('comments.reactions.session')}</Dialog.Description>
          <form
            className={styles.nameForm}
            onSubmit={(event) => {
              event.preventDefault()
              if (pending) void change(pending.emoji, pending.active, username)
            }}
          >
            <label htmlFor={`${id}-name`}>{t('meeting.anonymous.usernamePlaceholder')}</label>
            <Input id={`${id}-name`} dir='auto' autoComplete='nickname' maxLength={100} value={username} disabled={busy} onChange={event => setUsername(event.target.value)} />
            {error && <p role='alert'>{error}</p>}
            <div className={styles.formActions}>
              <Dialog.Cancel type='button' disabled={busy}>{t('common.cancel')}</Dialog.Cancel>
              <Button type='submit' buttonType='primary' disabled={!username.trim() || busy}>{t('comments.reactions.react')}</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Root>
      {error && !pending && <p role='alert' className={styles.error}>{error}</p>}
    </>
  )
}

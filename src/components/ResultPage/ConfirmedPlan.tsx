import {
  useEffect, useId, useRef, useState, type ReactNode,
} from 'react'
import { useStore } from '@nanostores/react'
import {
  HiChevronDown, HiOutlineGlobeAlt, HiOutlinePencil, HiOutlinePlusCircle, HiOutlineX,
} from 'react-icons/hi'
import { $me } from '../../stores/me'
import { useTranslation } from '../../hooks/useTranslation'
import { meetings, type get_meetings_$meetingCode_response } from '../../services/meetings'
import { formatDate } from '../../utils/time'
import { convertWallTime } from '../../utils/timezone'
import Button from '../Button/Button'
import Input from '../Input/Input'
import ZonedTime from '../Timezone/ZonedTime'
import styles from './ConfirmedPlan.module.scss'

export default function ConfirmedPlan ({
  data, resultZone, availableCount, children, onMeetingUpdated,
}: {
  data: get_meetings_$meetingCode_response['data']
  resultZone: string
  availableCount: number
  children: ReactNode
  onMeetingUpdated?: () => void
}) {
  const { t, locale } = useTranslation()
  const me = useStore($me)
  const { meeting, locationVote } = data
  const isHost = meeting.host.id === me?.userId
  const confirmedTime = meeting.confirmedTime ?? 'ALL_DAY'
  const hasTime = confirmedTime !== 'ALL_DAY'
  const [editing, setEditing] = useState(false)
  const [editedTime, setEditedTime] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const root = useRef<HTMLElement>(null)
  const editorId = useId()
  const date = meeting.confirmedDate ?? ''
  const displayDate = hasTime
    ? convertWallTime(date, confirmedTime, meeting.timezone, resultZone)?.date ?? date
    : date

  useEffect(() => {
    if (editing) root.current?.querySelector<HTMLInputElement>('input[type=time]')?.focus({ preventScroll: true })
  }, [editing])

  useEffect(() => {
    // A meeting can be cancelled or its host changed by a live update.
    if (!isHost || !date) setEditing(false)
  }, [date, isHost])

  const openEditor = () => {
    setEditedTime(hasTime ? confirmedTime.slice(0, 5) : '')
    setError('')
    setEditing(true)
  }
  const closeEditor = (saved = false) => {
    setEditing(false)
    setError('')
    requestAnimationFrame(() => root.current?.querySelector<HTMLElement>(saved ? 'h2' : '[data-time-edit]')?.focus({ preventScroll: true }))
  }
  const save = async () => {
    if (!editedTime || saving || !isHost) return
    setSaving(true)
    setError('')
    try {
      await meetings.$meetingCode.confirmedTime.put(meeting.code, { time: editedTime })
      closeEditor(true)
      onMeetingUpdated?.()
    } catch {
      setError(t(`meeting.result.confirmedPlan.${hasTime ? 'timeUpdateError' : 'timeConfirmError'}`))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section ref={root} className={styles.Plan} aria-label={t('meeting.result.confirmedPlan.title')}>
      <div className={styles.Heading}>
        <div>
          <h2 tabIndex={-1}><time dateTime={displayDate}>{formatDate(displayDate, locale)}</time></h2>
          <p>{t('meeting.result.confirmedPlan.title')}</p>
        </div>
        {isHost && !hasTime && !editing && (
          <button
            type='button'
            className={styles.TimeAction}
            data-time-edit
            aria-label={t('meeting.result.confirmedPlan.addTime')}
            aria-expanded={editing}
            aria-controls={editorId}
            onClick={openEditor}
          >
            <HiOutlinePlusCircle aria-hidden='true' />
            {t('meeting.result.confirmedPlan.addTimeTitle')}
          </button>
        )}
      </div>
      {isHost && (
        <form
          id={editorId}
          hidden={!editing}
          className={styles.Editor}
          aria-labelledby={`${editorId}-title`}
          aria-busy={saving}
          onSubmit={(event) => {
            event.preventDefault()
            void save()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !saving) {
              event.preventDefault()
              closeEditor()
            }
          }}
        >
          <div className={styles.EditorHeading}>
            <h3 id={`${editorId}-title`}>
              <label htmlFor={`${editorId}-input`}>{t(`meeting.result.confirmedPlan.${hasTime ? 'editTimeTitle' : 'addTimeTitle'}`)}</label>
            </h3>
            <button type='button' className={styles.CloseEditor} aria-label={t('meeting.exportDialog.cancel')} disabled={saving} onClick={() => closeEditor()}>
              <HiOutlineX aria-hidden='true' />
            </button>
          </div>
          <div className={styles.EditorControls}>
            <Input
              id={`${editorId}-input`}
              type='time'
              step='60'
              value={editedTime}
              onInput={(event) => {
                setEditedTime(event.currentTarget.value)
                setError('')
              }}
              aria-describedby={`${editorId}-zone${error ? ` ${editorId}-error` : ''}`}
              aria-invalid={!!error}
              required
              disabled={saving}
            />
            <Button type='submit' buttonType='primary' disabled={!editedTime || saving}>{t(`meeting.result.confirmedPlan.${saving ? 'savingTime' : 'saveTime'}`)}</Button>
          </div>
          {error && <p id={`${editorId}-error`} className={styles.Error} role='alert'>{error}</p>}
          <p id={`${editorId}-zone`} className={styles.Zone}>
            <HiOutlineGlobeAlt aria-hidden='true' />
            {t('timezone.meeting', { zone: meeting.timezone })}
          </p>
        </form>
      )}
      {((hasTime && !editing) || locationVote?.enabled) && (
        <dl className={styles.Details}>
          {hasTime && !editing && (
            <div>
              <dt>{t('meeting.result.confirmedPlan.time')}</dt>
              <dd>
                <ZonedTime date={date} time={confirmedTime} zone={meeting.timezone} targetZone={resultZone} compact />
                {isHost && (
                  <button type='button' data-time-edit aria-expanded={editing} aria-controls={editorId} onClick={openEditor} className={styles.TimeAction}>
                    <HiOutlinePencil aria-hidden='true' />{t('meeting.result.confirmedPlan.editTime')}
                  </button>
                )}
              </dd>
            </div>
          )}
          {locationVote?.enabled && (
            <div>
              <dt>{t('meeting.result.confirmedPlan.location')}</dt>
              <dd>{locationVote.confirmedLocation?.name ?? t('meeting.result.kakaoShare.locationPending')}</dd>
            </div>
          )}
        </dl>
      )}
      <details className={styles.Attendance}>
        <summary>
          <span>{t('meeting.result.confirmedPlan.attendanceCount', { count: availableCount, total: data.participants.length })}</span>
          <HiChevronDown aria-hidden='true' />
        </summary>
        {children}
      </details>
    </section>
  )
}

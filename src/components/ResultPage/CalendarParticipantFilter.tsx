import { useId } from 'react'
import Avatar from '../Avatar/Avatar'
import { useTranslation } from '../../hooks/useTranslation'
import { intlLocale } from '../../i18n/config'
import type { get_meetings_$meetingCode_response } from '../../services/meetings'
import styles from './CalendarParticipantFilter.module.scss'

export default function CalendarParticipantFilter ({
  participants, selectedIds, onToggle, onSelectAll, hasAvailability,
}: {
  participants: get_meetings_$meetingCode_response['data']['participants']
  selectedIds: ReadonlySet<number>
  onToggle: (userId: number) => void
  onSelectAll: (checked: boolean) => void
  hasAvailability: boolean
}) {
  const { t, locale } = useTranslation()
  const statusId = useId()
  const allSelected = participants.length > 0 && selectedIds.size === participants.length
  const numbers = new Intl.NumberFormat(intlLocale(locale))
  const statusKey = participants.length === 0
    ? 'meeting.participantsEmpty'
    : selectedIds.size === 0
      ? 'meeting.result.calendarFilter.selectPrompt'
      : !hasAvailability
          ? 'meeting.result.calendarFilter.noAvailability'
          : undefined

  return (
    <div className={styles.Section}>
      <fieldset className={styles.Filter} aria-describedby={statusKey ? statusId : undefined}>
        <legend className={styles.Title}>{t('meeting.result.tabs.participants')}</legend>
        <div className={styles.Heading}>
          <label className={styles.SelectAll}>
            <input
              type='checkbox'
              checked={allSelected}
              disabled={participants.length === 0}
              ref={(input) => { if (input) input.indeterminate = selectedIds.size > 0 && !allSelected }}
              onChange={event => onSelectAll(event.target.checked)}
            />
            <span>{t('meeting.result.calendarFilter.selectAll')}</span>
          </label>
          <span className={styles.Count}>
            {t('meeting.result.calendarFilter.selectedCount', {
              selected: numbers.format(selectedIds.size), total: numbers.format(participants.length),
            })}
          </span>
        </div>
        <ul className={styles.People}>
          {participants.map(person => (
            <li key={person.userId}>
              <label className={styles.Person}>
                <input type='checkbox' checked={selectedIds.has(person.userId)} onChange={() => onToggle(person.userId)} />
                <span aria-hidden='true'><Avatar src={person.profileImageUrl} name={person.username} size={28} /></span>
                <bdi>{person.username}</bdi>
              </label>
            </li>
          ))}
        </ul>
        {statusKey && <p id={statusId} className={styles.Hint} role='status'>{t(statusKey)}</p>}
      </fieldset>
    </div>
  )
}

import dayjs from 'dayjs'
import Avatar from '../Avatar/Avatar'
import { useTranslation } from '../../hooks/useTranslation'
import { formatDate } from '../../utils/time'
import type { get_meetings_$meetingCode_response } from '../../services/meetings'
import type { User } from '../../stores/me'
import styles from './DateParticipantsPanel.module.scss'

type Participant = get_meetings_$meetingCode_response['data']['participants'][number]

export default function DateParticipantsPanel ({
  date,
  participants,
  isSelected,
  me,
}: {
  date: dayjs.Dayjs | null
  participants: Participant[]
  isSelected: boolean
  me: User | null | undefined
}) {
  const { t, locale } = useTranslation()

  if (!date) return null

  const visibleParticipants = me
    ? isSelected
      ? participants.some(participant => participant.userId === me.userId)
        ? participants
        : [...participants, me]
      : participants.filter(participant => participant.userId !== me.userId)
    : participants

  return (
    <section className={styles.container} aria-live='polite'>
      <div className={styles.header}>
        <h3>{t('meeting.dateParticipants.title', { date: formatDate(date, locale) })}</h3>
        <span>{t('meeting.dateParticipants.count', { count: visibleParticipants.length })}</span>
      </div>
      {visibleParticipants.length > 0
        ? (
            <ul className={styles.list}>
              {visibleParticipants.map(participant => (
                <li key={participant.userId}>
                  <Avatar src={participant.profileImageUrl} name={participant.username} size={28} />
                  <span>{participant.username}</span>
                </li>
              ))}
            </ul>
          )
        : <p className={styles.empty}>{t('meeting.result.noParticipants')}</p>}
    </section>
  )
}

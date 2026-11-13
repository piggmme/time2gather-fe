import type { ReactElement } from 'react'
import { Tooltip } from 'radix-ui'
import type { get_meetings_$meetingCode_response } from '../../services/meetings'
import { useTranslation } from '../../hooks/useTranslation'
import { formatDate, formatTime } from '../../utils/time'
import Avatar from '../Avatar/Avatar'
import styles from './DailyParticipantsTooltip.module.scss'

export default function DailyParticipantsTooltip ({
  children, date, time, timezone, participants,
}: {
  children: ReactElement
  date: string
  time: string
  timezone: string
  participants: get_meetings_$meetingCode_response['data']['participants']
}) {
  const { t, locale } = useTranslation()
  return (
    <Tooltip.Root disableHoverableContent>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className={styles.content} side='top' sideOffset={8} collisionPadding={12}>
          <p className={styles.heading}>{formatDate(date, locale)} · {formatTime(time, locale, '')}</p>
          <bdi className={styles.zone}>{timezone.replaceAll('_', ' ')}</bdi>
          {participants.length > 0
            ? (
                <>
                  <p className={styles.count}>{t('meeting.result.participantsCount', { count: participants.length })}</p>
                  <ul className={styles.list}>
                    {participants.map(participant => (
                      <li key={participant.userId}>
                        <Avatar name={participant.username} src={participant.profileImageUrl} size={24} />
                        <bdi>{participant.username}</bdi>
                      </li>
                    ))}
                  </ul>
                </>
              )
            : <p className={styles.empty}>{t('meeting.result.noParticipants')}</p>}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

import dayjs from 'dayjs'
import { useDisplayTimeZone } from '../../hooks/useDisplayTimeZone'
import { useTranslation } from '../../hooks/useTranslation'
import { formatDate, formatTimeRange } from '../../utils/time'
import { convertWallTime } from '../../utils/timezone'
import styles from './Timezone.module.scss'
export default function ZonedTime ({
  date, time, zone, targetZone, compact = false,
}: {
  date: string
  time: string
  zone: string
  targetZone?: string
  compact?: boolean
}) {
  const { t, locale } = useTranslation()
  const [preferredZone] = useDisplayTimeZone(zone)
  const displayZone = targetZone ?? preferredZone
  const parts = time.split(/\s*(?:~|–)\s*/)
  const converted = time === 'ALL_DAY'
    ? []
    : parts.map((part, index) => convertWallTime(
        index > 0 && part < parts[0] ? dayjs(date).add(1, 'day').format('YYYY-MM-DD') : date,
        part, zone, displayZone,
      ))
  const canConvert = converted.length > 0 && converted.every(moment => moment !== undefined)
  const shownZone = canConvert ? displayZone : zone
  const shownTime = canConvert ? converted.map(moment => moment.time).join('–') : time
  if (compact) return <span className={styles.timeValue}>{formatTimeRange(shownTime, locale, t('meeting.confirmDialog.allDay'))}</span>
  return (
    <span className={styles.time}>
      {canConvert && converted[0].date !== date && <bdi>{formatDate(converted[0].date, locale)}</bdi>}
      <span className={styles.timeLine}>
        <bdi className={styles.timeValue}>{formatTimeRange(shownTime, locale, t('meeting.confirmDialog.allDay'))}</bdi>
        {time !== 'ALL_DAY' && <bdi className={styles.zoneName}>({shownZone})</bdi>}
      </span>
      {canConvert && converted.length > 1 && converted.at(-1)?.date !== converted[0].date && (
        <bdi>– {formatDate(converted.at(-1)!.date, locale)}</bdi>
      )}
    </span>
  )
}

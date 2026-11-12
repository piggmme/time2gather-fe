import { useState } from 'react'
import dayjs from 'dayjs'
import styles from './CreateMeeting.module.scss'
import Badge from '../Badge/Badge'
import { formatDate } from '../../utils/time'

export default function SelectedDates ({ dates, locale, visibleCount, badgeType = 'primary' }: { dates: (string | dayjs.Dayjs)[], locale: import('../../i18n').Locale, visibleCount?: number, badgeType?: 'default' | 'primary' | 'ghost' }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formattedDates = dates
    .map(d => d instanceof dayjs ? d : dayjs(d))
    .sort((a, b) => a.diff(b))
  const INITIAL_COUNT = visibleCount ?? 2
  const visibleDates = isExpanded ? formattedDates : formattedDates.slice(0, INITIAL_COUNT)
  const remainingCount = formattedDates.length - INITIAL_COUNT

  return (
    <div className={styles.dateBadges}>
      {visibleDates.map(d => (
        <Badge key={d.format('YYYY-MM-DD')} text={formatDate(d, locale)} type={badgeType} />
      ))}
      {!isExpanded && remainingCount > 0 && (
        <button
          type='button'
          className={styles.moreButton}
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded(true)}
        >
          +{remainingCount}
        </button>
      )}
    </div>
  )
}

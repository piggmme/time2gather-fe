import { useState } from 'react'
import dayjs from 'dayjs'
import styles from './SelectedDates.module.scss'
import { formatDate } from '../../utils/time'

export default function SelectedDates ({ dates, locale, visibleCount }: { dates: (string | dayjs.Dayjs)[], locale: import('../../i18n').Locale, visibleCount?: number }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formattedDates = dates
    .map(d => d instanceof dayjs ? d : dayjs(d))
    .sort((a, b) => a.diff(b))
  const INITIAL_COUNT = visibleCount ?? 2
  const visibleDates = isExpanded ? formattedDates : formattedDates.slice(0, INITIAL_COUNT)
  const remainingCount = formattedDates.length - INITIAL_COUNT

  return (
    <div className={styles.summary}>
      <ul className={styles.dates}>
        {visibleDates.map(d => (
          <li key={d.format('YYYY-MM-DD')} className={styles.date}>
            <time dateTime={d.format('YYYY-MM-DD')}>{formatDate(d, locale)}</time>
          </li>
        ))}
      </ul>
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

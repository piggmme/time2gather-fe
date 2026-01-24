import DailyGrid from './DailyGrid'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import 'dayjs/locale/en'
import styles from './Daily.module.scss'
import { useRef, useEffect, useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useStore } from '@nanostores/react'
import { $locale } from '../../stores/locale'
import { formatDate } from '../../utils/time'
import type { get_meetings_$meetingCode_response } from '../../services/meetings'

type DailyProps = {
  dates: dayjs.Dayjs[]
  availableTimes: string[]
  height?: string
  selections?: { [date: string]: string[] }
  setSelections?: Dispatch<SetStateAction<{ [date: string]: string[] }>>
  schedule?: get_meetings_$meetingCode_response['data']['schedule']
  participantsCount: number
  mode?: 'edit' | 'view'
  onCellClick?: (date: string, time: string) => void
}

export default function Daily ({
  dates,
  availableTimes,
  height = 'auto',
  selections = {},
  setSelections = () => {},
  schedule,
  participantsCount,
  mode = 'edit',
  onCellClick,
}: DailyProps) {
  const locale = useStore($locale)
  const dateHeaderScrollRef = useRef<HTMLDivElement>(null)
  const gridScrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollWrapperRef = useRef<HTMLDivElement>(null)

  // 스크롤 동기화 중 무한 루프 방지용 플래그
  const isSyncingRef = useRef(false)

  // Update dayjs locale when locale changes
  useEffect(() => {
    dayjs.locale(locale === 'ko' ? 'ko' : 'en')
  }, [locale])

  // 날짜 헤더 → 그리드 스크롤 동기화
  const syncHeaderToGrid = useCallback(() => {
    if (isSyncingRef.current) return
    if (dateHeaderScrollRef.current && gridScrollContainerRef.current) {
      isSyncingRef.current = true
      gridScrollContainerRef.current.scrollLeft = dateHeaderScrollRef.current.scrollLeft
      requestAnimationFrame(() => {
        isSyncingRef.current = false
      })
    }
  }, [])

  // 그리드 → 날짜 헤더 스크롤 동기화
  const syncGridToHeader = useCallback(() => {
    if (isSyncingRef.current) return
    if (dateHeaderScrollRef.current && gridScrollContainerRef.current) {
      isSyncingRef.current = true
      dateHeaderScrollRef.current.scrollLeft = gridScrollContainerRef.current.scrollLeft
      requestAnimationFrame(() => {
        isSyncingRef.current = false
      })
    }
  }, [])

  // 가로 스크롤 동기화 설정
  useEffect(() => {
    const dateHeaderScroll = dateHeaderScrollRef.current
    const gridScrollContainer = gridScrollContainerRef.current

    if (dateHeaderScroll && gridScrollContainer) {
      dateHeaderScroll.addEventListener('scroll', syncHeaderToGrid)
      gridScrollContainer.addEventListener('scroll', syncGridToHeader)

      return () => {
        dateHeaderScroll.removeEventListener('scroll', syncHeaderToGrid)
        gridScrollContainer.removeEventListener('scroll', syncGridToHeader)
      }
    }
  }, [syncHeaderToGrid, syncGridToHeader])

  return (
    <div className={styles.container} style={{ maxHeight: height, height: 'auto' }}>
      <div className={styles.wrapper}>
        {/* 날짜 헤더 - sticky 고정 */}
        <div className={styles.dateHeaderRow}>
          <div className={styles.timeColumnHeader} />
          <div className={styles.dateHeaderScroll} ref={dateHeaderScrollRef}>
            {dates.map(date => (
              <div key={date.format('YYYY-MM-DD')} className={styles.dateHeader}>
                <span className={styles.dateTitle}>{formatDate(date, locale)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 시간 그리드 */}
        <div className={styles.scrollWrapper} ref={scrollWrapperRef}>
          <div className={styles.timeColumn}>
            {availableTimes.map((time) => {
              const isFullHour = time.endsWith(':00')
              return (
                <div
                  key={time}
                  className={`${styles.timeCell} ${isFullHour ? styles.fullHour : styles.halfHour}`}
                >
                  {time}
                </div>
              )
            })}
          </div>
          <div className={styles.gridScrollContainer} ref={gridScrollContainerRef}>
            {
              dates.map(date => (
                <div key={date.format('YYYY-MM-DD')} className={styles.dateWrapper}>
                  <DailyGrid
                    date={date}
                    availableTimes={availableTimes}
                    schedule={schedule?.[date.format('YYYY-MM-DD')]}
                    participantsCount={participantsCount}
                    initialSelectedTimeSlots={selections[date.format('YYYY-MM-DD')]}
                    onSelectionsChange={(selectedTimeSlots) => {
                      setSelections(prev => ({
                        ...prev,
                        [date.format('YYYY-MM-DD')]: selectedTimeSlots,
                      }))
                    }}
                    mode={mode}
                    onCellClick={onCellClick}
                  />
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}

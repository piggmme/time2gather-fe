import DailyGrid from './DailyGrid'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import 'dayjs/locale/en'
import styles from './Daily.module.scss'
import { useState, useRef, useEffect, useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { HiChevronLeft, HiChevronRight, HiChevronUp, HiChevronDown } from 'react-icons/hi'
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
  const [showLeftButton, setShowLeftButton] = useState(false)
  const [showRightButton, setShowRightButton] = useState(true)
  const [showTopButton, setShowTopButton] = useState(false)
  const [showBottomButton, setShowBottomButton] = useState(true)
  
  // 스크롤 동기화 중 무한 루프 방지용 플래그
  const isSyncingRef = useRef(false)

  // Update dayjs locale when locale changes
  useEffect(() => {
    dayjs.locale(locale === 'ko' ? 'ko' : 'en')
  }, [locale])

  const checkHorizontalScroll = useCallback(() => {
    const scrollContainer = dateHeaderScrollRef.current || gridScrollContainerRef.current
    if (scrollContainer) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainer

      // 스크롤이 필요 없는 경우 (모든 내용이 화면에 보이는 경우)
      if (scrollWidth <= clientWidth) {
        setShowLeftButton(false)
        setShowRightButton(false)
        return
      }

      const isAtLeft = scrollLeft <= 10
      const isAtRight = scrollLeft + clientWidth >= scrollWidth - 10

      setShowLeftButton(!isAtLeft)
      setShowRightButton(!isAtRight)
    }
  }, [])

  const checkVerticalScroll = useCallback(() => {
    if (scrollWrapperRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollWrapperRef.current
      const isAtTop = scrollTop <= 10
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10

      setShowTopButton(!isAtTop)
      setShowBottomButton(!isAtBottom)
    }
  }, [])

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

  // 가로 스크롤 이벤트 및 동기화 설정
  useEffect(() => {
    const dateHeaderScroll = dateHeaderScrollRef.current
    const gridScrollContainer = gridScrollContainerRef.current

    if (dateHeaderScroll && gridScrollContainer) {
      // 초기 상태 확인
      checkHorizontalScroll()

      // 날짜 헤더 스크롤 시 그리드 동기화 + 버튼 상태 업데이트
      const handleHeaderScroll = () => {
        syncHeaderToGrid()
        checkHorizontalScroll()
      }

      // 그리드 스크롤 시 날짜 헤더 동기화 + 버튼 상태 업데이트
      const handleGridScroll = () => {
        syncGridToHeader()
        checkHorizontalScroll()
      }

      dateHeaderScroll.addEventListener('scroll', handleHeaderScroll)
      gridScrollContainer.addEventListener('scroll', handleGridScroll)

      // resize 이벤트도 감지
      const handleResize = () => {
        checkHorizontalScroll()
      }
      window.addEventListener('resize', handleResize)

      const timer1 = setTimeout(checkHorizontalScroll, 100)

      return () => {
        dateHeaderScroll.removeEventListener('scroll', handleHeaderScroll)
        gridScrollContainer.removeEventListener('scroll', handleGridScroll)
        window.removeEventListener('resize', handleResize)
        clearTimeout(timer1)
      }
    }
  }, [checkHorizontalScroll, syncHeaderToGrid, syncGridToHeader])

  // 세로 스크롤 이벤트 설정
  useEffect(() => {
    const scrollWrapper = scrollWrapperRef.current

    if (scrollWrapper) {
      checkVerticalScroll()
      scrollWrapper.addEventListener('scroll', checkVerticalScroll)
      const timer2 = setTimeout(checkVerticalScroll, 100)

      return () => {
        scrollWrapper.removeEventListener('scroll', checkVerticalScroll)
        clearTimeout(timer2)
      }
    }
  }, [checkVerticalScroll])

  const scrollLeft = () => {
    // 두 영역 모두 스크롤 (동기화로 인해 하나만 해도 되지만 명시적으로 둘 다)
    dateHeaderScrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' })
    gridScrollContainerRef.current?.scrollBy({ left: -200, behavior: 'smooth' })
  }

  const scrollRight = () => {
    dateHeaderScrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' })
    gridScrollContainerRef.current?.scrollBy({ left: 200, behavior: 'smooth' })
  }

  const scrollUp = () => {
    if (scrollWrapperRef.current) {
      scrollWrapperRef.current.scrollBy({ top: -200, behavior: 'smooth' })
    }
  }

  const scrollDown = () => {
    if (scrollWrapperRef.current) {
      scrollWrapperRef.current.scrollBy({ top: 200, behavior: 'smooth' })
    }
  }

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
        <button
          className={`${styles.scrollButton} ${styles.floatingButton} ${styles.scrollButtonTop}`}
          onClick={scrollUp}
          aria-label='위로 스크롤'
          style={{ opacity: showTopButton ? 1 : 0, pointerEvents: showTopButton ? 'auto' : 'none' }}
        >
          <HiChevronUp />
        </button>
        <button
          className={`${styles.scrollButton} ${styles.floatingButton} ${styles.scrollButtonLeft}`}
          onClick={scrollLeft}
          aria-label='왼쪽으로 스크롤'
          style={{ opacity: showLeftButton ? 1 : 0, pointerEvents: showLeftButton ? 'auto' : 'none' }}
        >
          <HiChevronLeft />
        </button>
        <button
          className={`${styles.scrollButton} ${styles.floatingButton} ${styles.scrollButtonRight}`}
          onClick={scrollRight}
          aria-label='오른쪽으로 스크롤'
          style={{ opacity: showRightButton ? 1 : 0, pointerEvents: showRightButton ? 'auto' : 'none' }}
        >
          <HiChevronRight />
        </button>
        <button
          className={`${styles.scrollButton} ${styles.floatingButton} ${styles.scrollButtonBottom}`}
          onClick={scrollDown}
          aria-label='아래로 스크롤'
          style={{ opacity: showBottomButton ? 1 : 0, pointerEvents: showBottomButton ? 'auto' : 'none' }}
        >
          <HiChevronDown />
        </button>
      </div>
    </div>
  )
}

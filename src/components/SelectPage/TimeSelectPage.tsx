import Daily from '../daily/Daily'
import dayjs from 'dayjs'
import { useTranslation } from '../../hooks/useTranslation'
import styles from './SelectPage.module.scss'
import { useEffect, useRef, useState, useMemo } from 'react'
import Button from '../Button/Button'
import { meetings, type get_meetings_$meetingCode_response } from '../../services/meetings'
import { useStore } from '@nanostores/react'
import { $me } from '../../stores/me'
import { navigate } from 'astro:transitions/client'
import { showDefaultToast } from '../../stores/toast'

export default function TimeSelectPage (
  { meetingCode, data }:
  { meetingCode: string, data: get_meetings_$meetingCode_response['data'] },
) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<string>('100svh')
  const [selections, setSelections] = useState<{ [date: string]: string[] }>({})

  useEffect(() => {
    if (containerRef.current) {
      // containerRef 의 왼쪽 상단 모서리 위치 계산
      const leftTop = containerRef.current.getBoundingClientRect()
      setHeight(`calc(100svh - ${leftTop.top}px - 30px - 60px)`)
    }
  }, [])

  const me = useStore($me)
  const dates = Object.keys(data.meeting.availableDates)
  const dateList = dates.map(date => dayjs(date)).sort((a, b) => a.diff(b))
  const availableTimes = Object.values(data.meeting.availableDates)[0] || []

  // schedule에서 내가 선택한 날짜와 시간대를 selections의 초기값으로 설정
  useEffect(function initializeSelections () {
    if (!me || !data.schedule) return

    const initialSelections: { [date: string]: string[] } = {}

    for (const [date, timeSlots] of Object.entries(data.schedule)) {
      const selectedTimes: string[] = []

      for (const [time, slot] of Object.entries(timeSlots)) {
        const isMeIncluded = slot.participants.some(p => p.userId === me.userId)
        if (isMeIncluded) {
          selectedTimes.push(time)
        }
      }

      if (selectedTimes.length > 0) {
        initialSelections[date] = selectedTimes
      }
    }

    setSelections(initialSelections)
  }, [me, data.schedule])

  // schedule에서 자신이 포함된 경우 count를 1 낮춤
  const schedule = useMemo(() => {
    if (!me) return undefined

    const processedSchedule: typeof data.schedule = {}
    for (const [date, timeSlots] of Object.entries(data.schedule)) {
      processedSchedule[date] = {}
      for (const [time, slot] of Object.entries(timeSlots)) {
        const isMeIncluded = slot.participants.some(p => p.userId === me.userId)
        processedSchedule[date][time] = {
          ...slot,
          count: isMeIncluded ? Math.max(0, slot.count - 1) : slot.count,
        }
      }
    }
    return processedSchedule
  }, [data.schedule, me])

  return (
    <div>
      <div className={styles.selectedDatesInfo}>
        <p>{t('meeting.participantsCount', { count: data.participants.length })}</p>
        <p>{t('meeting.selectedDates', { count: dates.length })}</p>
      </div>
      <div
        className={styles.container}
        ref={containerRef}
      >
        <Daily
          dates={dateList}
          availableTimes={availableTimes}
          height={height}
          selections={selections}
          setSelections={setSelections}
          schedule={schedule}
          participantsCount={data.participants.length}
        />
      </div>
      <div className={styles.buttonContainer}>
        <Button
          buttonType='ghost'
          onClick={() => {
            // 이번 페이지가 없을 때는 미팅 페이지로 이동
            if (window.history.length === 1) {
              navigate(`/meetings/${meetingCode}`)
            } else {
              window.history.back()
            }
          }}
        >
          {t('common.cancel')}
        </Button>
        <Button
          buttonType='primary'
          disabled={Object.entries(selections).every(([_, times]) => times.length === 0)}
          onClick={async () => {
            // selections 에서 빈배열인 날짜는 제거
            await meetings.$meetingCode.selections.put(meetingCode, {
              selections: Object.entries(selections).filter(([_, times]) => times.length > 0).map(([date, times]) => ({
                date,
                type: 'TIME',
                times,
              })),
            })
            setTimeout(() => {
              showDefaultToast({
                message: t('meeting.resultSaved'),
                duration: 3000,
              })
            }, 500)
            navigate(`/meetings/${meetingCode}/result`)
          }}
        >
          {t('common.submit')}
        </Button>
      </div>
    </div>
  )
}

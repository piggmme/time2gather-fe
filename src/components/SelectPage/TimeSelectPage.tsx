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
import LocationVoteSection from './LocationVoteSection'

export default function TimeSelectPage (
  { meetingCode, data }:
  { meetingCode: string, data: get_meetings_$meetingCode_response['data'] },
) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<string>('auto')
  const [selections, setSelections] = useState<{ [date: string]: string[] }>({})
  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([])

  useEffect(() => {
    const calculateHeight = () => {
      if (containerRef.current) {
        // containerRef 의 왼쪽 상단 모서리 위치 계산
        const leftTop = containerRef.current.getBoundingClientRect()
        // window.innerHeight를 사용하여 카카오톡 인앱 브라우저에서도 정확한 높이 계산
        // 30px: 하단 여백, 60px: 버튼 컨테이너 높이
        const calculatedHeight = window.innerHeight - leftTop.top - 30 - 60
        setHeight(`${calculatedHeight}px`)
      }
    }

    calculateHeight()

    // 화면 리사이즈 시 높이 재계산 (카카오톡 인앱에서 키보드 등으로 뷰포트 변경 시 대응)
    window.addEventListener('resize', calculateHeight)
    return () => window.removeEventListener('resize', calculateHeight)
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
      
      {data.locationVote?.enabled && data.locationVote.locations && (
        <LocationVoteSection
          meetingCode={meetingCode}
          locations={data.locationVote.locations}
          confirmedLocation={data.locationVote.confirmedLocation}
          onSelectionsChange={setSelectedLocationIds}
        />
      )}
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
            try {
              // selections 에서 빈배열인 날짜는 제거
              const timeSelectionsPromise = meetings.$meetingCode.selections.put(meetingCode, {
                selections: Object.entries(selections).filter(([_, times]) => times.length > 0).map(([date, times]) => ({
                  date,
                  type: 'TIME',
                  times,
                })),
              })

              // 장소 투표가 활성화되어 있으면 장소 선택도 저장
              const locationSelectionsPromise = data.locationVote?.enabled
                ? meetings.$meetingCode.locationSelections.put(meetingCode, { locationIds: selectedLocationIds })
                : Promise.resolve()

              await Promise.all([timeSelectionsPromise, locationSelectionsPromise])

              setTimeout(() => {
                showDefaultToast({
                  message: t('meeting.resultSaved'),
                  duration: 3000,
                })
              }, 500)
              navigate(`/meetings/${meetingCode}/result`)
            } catch (error) {
              const errorResponse = error as { response?: { data?: { messageKey?: string } } }
              if (errorResponse.response?.data?.messageKey === 'error.meeting.already.confirmed') {
                alert(t('meeting.alreadyConfirmedError'))
                navigate(`/meetings/${meetingCode}/result`)
              } else {
                showDefaultToast({
                  message: t('common.error'),
                  duration: 3000,
                })
              }
            }
          }}
        >
          {t('common.submit')}
        </Button>
      </div>
    </div>
  )
}

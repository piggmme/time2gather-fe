import dayjs from 'dayjs'
import { useTranslation } from '../../hooks/useTranslation'
import styles from './SelectPage.module.scss'
import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '../Button/Button'
import { meetings, type get_meetings_$meetingCode_response } from '../../services/meetings'
import { navigate } from 'astro:transitions/client'
import { showDefaultToast } from '../../stores/toast'
import Monthly from '../Monthly/Monthly'
import { useStore } from '@nanostores/react'
import { $me } from '../../stores/me'
import LocationVoteSection from './LocationVoteSection'

export default function DatesSelectPage (
  { meetingCode, data }:
  { meetingCode: string, data: get_meetings_$meetingCode_response['data'] },
) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedDates, setSelectedDates] = useState<dayjs.Dayjs[]>([])
  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([])
  const me = useStore($me)

  useEffect(function initializeSelections () {
    if (!me) return
    const mySelectedDates: dayjs.Dayjs[] = []
    for (const [date, timeSlots] of Object.entries(data.schedule)) {
      const allDaySlot = timeSlots['ALL_DAY']
      if (allDaySlot && allDaySlot.participants.some(p => p.userId === me.userId)) {
        mySelectedDates.push(dayjs(date))
      }
    }
    setSelectedDates(mySelectedDates)
  }, [me, data.schedule])

  // ALL_DAY 타입의 schedule을 dateSchedule 형태로 변환
  // 자신이 포함된 경우 count를 1 낮춤 (Daily와 동일한 로직)
  // const dateSchedule = useMemo(() => {
  //   const schedule: { [date: string]: { count: number, participants: typeof data.participants } } = {}
  //   for (const [date, timeSlots] of Object.entries(data.schedule)) {
  //     const allDaySlot = timeSlots['ALL_DAY']
  //     if (allDaySlot) {
  //       const isMeIncluded = me ? allDaySlot.participants.some(p => p.userId === me.userId) : false
  //       schedule[date] = {
  //         count: isMeIncluded ? Math.max(0, allDaySlot.count - 1) : allDaySlot.count,
  //         participants: allDaySlot.participants,
  //       }
  //     }
  //   }
  //   return schedule
  // }, [data.schedule, me])

  console.log({ selectedDates })

  const dates = Object.keys(data.meeting.availableDates)

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
        <Monthly
          mode='edit'
          dates={selectedDates}
          setDates={setSelectedDates}
          availableDates={Object.keys(data.meeting.availableDates).map(date => dayjs(date))}
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
          disabled={selectedDates.length === 0}
          onClick={async () => {
            try {
              // selections 에서 빈배열인 날짜는 제거
              const dateSelectionsPromise = meetings.$meetingCode.selections.put(meetingCode, {
                selections: selectedDates.map(date => ({
                  date: date.format('YYYY-MM-DD'),
                  type: 'ALL_DAY',
                  times: [],
                })),
              })

              // 장소 투표가 활성화되어 있으면 장소 선택도 저장
              const locationSelectionsPromise = data.locationVote?.enabled
                ? meetings.$meetingCode.locationSelections.put(meetingCode, { locationIds: selectedLocationIds })
                : Promise.resolve()

              await Promise.all([dateSelectionsPromise, locationSelectionsPromise])

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

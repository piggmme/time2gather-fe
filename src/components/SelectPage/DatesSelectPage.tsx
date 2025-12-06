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
import Monthly from '../Monthly/Monthly'

export default function DatesSelectPage (
  { meetingCode, data }:
  { meetingCode: string, data: get_meetings_$meetingCode_response['data'] },
) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedDates, setSelectedDates] = useState<dayjs.Dayjs[]>([])

  const dates = Object.keys(data.meeting.availableDates)
  const dateList = dates.map(date => dayjs(date)).sort((a, b) => a.diff(b))

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
          dates={dateList}
          mode='edit'
          setDates={setSelectedDates}
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
          // disabled={Object.entries(selections).every(([_, times]) => times.length === 0)}
          // onClick={async () => {
          //   // selections 에서 빈배열인 날짜는 제거
          //   const filteredSelections = Object.fromEntries(Object.entries(selections).filter(([_, times]) => times.length > 0))
          //   const response = await meetings.$meetingCode.selections.put(meetingCode, {
          //     selections: filteredSelections,
          //   })
          //   setTimeout(() => {
          //     showDefaultToast({
          //       message: t('meeting.resultSaved'),
          //       duration: 3000,
          //     })
          //   }, 500)
          //   navigate(`/meetings/${meetingCode}/result`)
          // }}
        >
          {t('common.submit')}
        </Button>
      </div>
    </div>
  )
}

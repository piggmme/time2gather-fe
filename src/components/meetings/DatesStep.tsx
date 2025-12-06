import Monthly from '../Monthly/Monthly'
import styles from './CreateMeeting.module.scss'
import { navigate } from 'astro:transitions/client'
import Button from '../Button/Button'
import useSelectedDates from './useSelectedDates'
import { useSearchParam } from 'react-use'
import { useTranslation } from '../../hooks/useTranslation'
import { meetings } from '../../services/meetings'
import { showDefaultToast } from '../../stores/toast'

export default function DatesStep () {
  const [selectedDates, setSelectedDates] = useSelectedDates()
  const title = useSearchParam('title')
  const meetingTypeParam = useSearchParam('meetingType')
  const { t } = useTranslation()

  return (
    <>
      <h2>{t('createMeeting.datesStep.heading')}</h2>
      <div className={styles.monthlyContainer}>
        <Monthly dates={selectedDates} setDates={setSelectedDates} />
      </div>
      <div className={styles.buttonContainer}>
        <Button
          buttonType='ghost'
          onClick={() => {
            navigate(`/meetings/create?step=title&meetingType=${meetingTypeParam}&title=${title}`)
          }}
        >
          {t('common.previous')}
        </Button>
        {meetingTypeParam === 'timeRange' && (
          <Button
            buttonType='primary'
            disabled={selectedDates.length === 0}
            onClick={() => {
              if (selectedDates.length === 0) return

              const dateStrings = selectedDates.map(date => date.format('YYYY-MM-DD'))
              const newUrl = `/meetings/create?step=timeRange&meetingType=${meetingTypeParam}&dates=${dateStrings.join(',')}&title=${title}`
              navigate(newUrl)
            }}
          >
            {t('common.next')}
          </Button>
        )}
        {meetingTypeParam === 'simple' && (
          <Button
            buttonType='primary'
            disabled={selectedDates.length === 0}
            onClick={async () => {
              if (selectedDates.length === 0) return

              const response = await meetings.post({
                title: title as string,
                timezone: 'Asia/Seoul',
                availableDates: selectedDates.reduce((acc, d) => {
                  acc[d.format('YYYY-MM-DD')] = null
                  return acc
                }, {} as { [date: string]: null }),
              })
              if (response.success) {
                navigate(`/meetings/${response.data.meetingCode}`)
                navigator.clipboard.writeText(window.location.pathname + `/meetings/${response.data.meetingCode}`)
                showDefaultToast({
                  message: t('meeting.shareSuccess'),
                  duration: 3000,
                })
              } else {
                console.error(response.message)
              }
            }}
          >
            {t('createMeeting.timeRangeStep.createButton')}
          </Button>
        )}
      </div>
    </>
  )
}

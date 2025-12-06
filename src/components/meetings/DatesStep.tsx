import Monthly from '../Monthly/Monthly'
import styles from './CreateMeeting.module.scss'
import { navigate } from 'astro:transitions/client'
import Button from '../Button/Button'
import useSelectedDates from './useSelectedDates'
import { useSearchParam } from 'react-use'
import { useTranslation } from '../../hooks/useTranslation'

export default function DatesStep () {
  const [selectedDates, setSelectedDates] = useSelectedDates()
  const title = useSearchParam('title')
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
            navigate(`/meetings/create?step=title&title=${title}`)
          }}
        >
          {t('common.previous')}
        </Button>
        <Button
          buttonType='primary'
          disabled={selectedDates.length === 0}
          onClick={() => {
            if (selectedDates.length === 0) return

            const dateStrings = selectedDates.map(date => date.format('YYYY-MM-DD'))
            const newUrl = `/meetings/create?step=timeRange&dates=${dateStrings.join(',')}&title=${title}`
            navigate(newUrl)
          }}
        >
          {t('common.next')}
        </Button>
      </div>
    </>
  )
}

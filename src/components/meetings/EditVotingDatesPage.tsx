import { useState } from 'react'
import dayjs from 'dayjs'
import { navigate } from 'astro:transitions/client'
import Monthly from '../Monthly/Monthly'
import Button from '../Button/Button'
import { meetings } from '../../services/meetings'
import { useTranslation } from '../../hooks/useTranslation'
import { showDefaultToast } from '../../stores/toast'
import styles from './EditVotingDatesPage.module.scss'

const MAX_DATES = 31

export default function EditVotingDatesPage ({
  meetingCode,
  initialDates,
}: {
  meetingCode: string
  initialDates: string[]
}) {
  const { t } = useTranslation()
  const [selectedDates, setSelectedDates] = useState(() => initialDates
    .map(date => dayjs(date))
    .sort((a, b) => a.diff(b)))
  const [isSaving, setIsSaving] = useState(false)
  const selectedDateKeys = selectedDates.map(date => date.format('YYYY-MM-DD'))
  const removedCount = initialDates.filter(date => !selectedDateKeys.includes(date)).length
  const resultUrl = `/meetings/${meetingCode}`

  const handleDatesChange = (dates: dayjs.Dayjs[]) => {
    if (dates.length > MAX_DATES) {
      showDefaultToast({
        message: t('meeting.editDates.maxDates', { count: MAX_DATES }),
        duration: 2500,
      })
      return
    }
    setSelectedDates(dates.sort((a, b) => a.diff(b)))
  }

  const handleSave = async () => {
    if (selectedDates.length === 0 || isSaving) return
    setIsSaving(true)

    try {
      await meetings.$meetingCode.availableDates.put(meetingCode, { dates: selectedDateKeys })
      showDefaultToast({
        message: t('meeting.editDates.success'),
        duration: 3000,
      })
      navigate(resultUrl)
    } catch (error) {
      console.error('Failed to update voting dates:', error)
      showDefaultToast({
        message: t('meeting.editDates.error'),
        duration: 3000,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.hostBadge}>{t('meeting.editDates.hostOnly')}</span>
        <h1>{t('meeting.editDates.title')}</h1>
        <p>{t('meeting.editDates.description')}</p>
      </div>

      <div className={styles.summary} aria-live='polite'>
        <strong>{t('meeting.editDates.selectedCount', { count: selectedDates.length })}</strong>
        <span>{t('meeting.editDates.selectionHint')}</span>
      </div>

      <div className={styles.calendar}>
        <Monthly
          dates={selectedDates}
          setDates={handleDatesChange}
          allowPastSelected
        />
      </div>

      {removedCount > 0 && (
        <p className={styles.warning} role='status'>
          {t('meeting.editDates.removedWarning', { count: removedCount })}
        </p>
      )}

      <div className={styles.buttons}>
        <Button as='a' href={resultUrl} buttonType='ghost'>
          {t('common.cancel')}
        </Button>
        <Button
          buttonType='primary'
          disabled={selectedDates.length === 0 || isSaving}
          onClick={handleSave}
        >
          {t('meeting.editDates.save')}
        </Button>
      </div>
    </div>
  )
}

import { useState } from 'react'
import styles from './CreateMeeting.module.scss'
import Button from '../Button/Button'
import { navigate } from 'astro:transitions/client'
import { useSearchParam } from 'react-use'
import Input from '../Input/Input'
import { useTranslation } from '../../hooks/useTranslation'
import { meetings, type post_meetings_body } from '../../services/meetings'
import { showDefaultToast } from '../../stores/toast'
import useSelectedDates from './useSelectedDates'
import { convertTo24Hour, getTimeRangeSlots } from '../../utils/time'
import type { AmPm } from '../../utils/time'

const MAX_LOCATIONS = 5
const MIN_LOCATIONS = 2

export default function LocationStep () {
  const [locationVoteEnabled, setLocationVoteEnabled] = useState(false)
  const [locations, setLocations] = useState<string[]>(['', ''])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [selectedDates] = useSelectedDates()
  const title = useSearchParam('title')
  const meetingTypeParam = useSearchParam('meetingType') as post_meetings_body['selectionType']
  const startTime12Param = useSearchParam('startTime12')
  const endTime12Param = useSearchParam('endTime12')
  const startAmPmParam = useSearchParam('startAmPm') as AmPm
  const endAmPmParam = useSearchParam('endAmPm') as AmPm
  const { t } = useTranslation()

  const validLocations = locations.filter(loc => loc.trim() !== '')
  const canSubmit = !locationVoteEnabled || validLocations.length >= MIN_LOCATIONS

  const handleAddLocation = () => {
    if (locations.length < MAX_LOCATIONS) {
      setLocations([...locations, ''])
    }
  }

  const handleRemoveLocation = (index: number) => {
    if (locations.length > MIN_LOCATIONS) {
      setLocations(locations.filter((_, i) => i !== index))
    }
  }

  const handleLocationChange = (index: number, value: string) => {
    const newLocations = [...locations]
    newLocations[index] = value
    setLocations(newLocations)
  }

  const buildAvailableDates = () => {
    if (meetingTypeParam === 'ALL_DAY') {
      return selectedDates.reduce((acc, d) => {
        acc[d.format('YYYY-MM-DD')] = null
        return acc
      }, {} as { [date: string]: null })
    } else {
      const startTime24 = convertTo24Hour(startTime12Param || '9:00', startAmPmParam || 'AM')
      const endTime24 = convertTo24Hour(endTime12Param || '6:00', endAmPmParam || 'PM')
      return selectedDates.reduce((acc, d) => {
        acc[d.format('YYYY-MM-DD')] = getTimeRangeSlots(startTime24, endTime24)
        return acc
      }, {} as { [date: string]: string[] })
    }
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const body: post_meetings_body = {
        title: title as string,
        timezone: 'Asia/Seoul',
        selectionType: meetingTypeParam,
        availableDates: buildAvailableDates(),
      }

      if (locationVoteEnabled && validLocations.length >= MIN_LOCATIONS) {
        body.locationVoteEnabled = true
        body.locations = validLocations
      }

      const response = await meetings.post(body)
      if (response.success) {
        navigate(`/meetings/${response.data.meetingCode}`)
        navigator.clipboard.writeText(window.location.origin + `/meetings/${response.data.meetingCode}`)
        showDefaultToast({
          message: t('meeting.shareSuccess'),
          duration: 3000,
        })
      } else {
        console.error(response.message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    const dateStrings = selectedDates.map(date => date.format('YYYY-MM-DD')).join(',')
    if (meetingTypeParam === 'TIME') {
      const timeParams = `&startTime12=${startTime12Param}&endTime12=${endTime12Param}&startAmPm=${startAmPmParam}&endAmPm=${endAmPmParam}`
      navigate(`/meetings/create?step=timeRange&meetingType=${meetingTypeParam}&dates=${dateStrings}&title=${title}${timeParams}`)
    } else {
      navigate(`/meetings/create?step=dates&meetingType=${meetingTypeParam}&dates=${dateStrings}&title=${title}`)
    }
  }

  return (
    <>
      <h2 className={styles.title}>{t('createMeeting.locationStep.heading')}</h2>
      
      <div className={styles.locationToggleContainer}>
        <label className={styles.locationToggle}>
          <input
            type="checkbox"
            checked={locationVoteEnabled}
            onChange={(e) => setLocationVoteEnabled(e.target.checked)}
          />
          <span className={styles.locationToggleLabel}>
            {t('createMeeting.locationStep.enableLocationVote')}
          </span>
        </label>
        <p className={styles.locationToggleDescription}>
          {t('createMeeting.locationStep.enableLocationVoteDescription')}
        </p>
      </div>

      {locationVoteEnabled && (
        <div className={styles.locationInputsContainer}>
          {locations.map((location, index) => (
            <div key={index} className={styles.locationInputRow}>
              <Input
                placeholder={t('createMeeting.locationStep.locationPlaceholder')}
                value={location}
                onChange={(e) => handleLocationChange(index, e.target.value)}
              />
              {locations.length > MIN_LOCATIONS && (
                <button
                  type="button"
                  className={styles.locationRemoveButton}
                  onClick={() => handleRemoveLocation(index)}
                  aria-label={t('createMeeting.locationStep.removeLocation')}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          
          {locations.length < MAX_LOCATIONS && (
            <button
              type="button"
              className={styles.locationAddButton}
              onClick={handleAddLocation}
            >
              + {t('createMeeting.locationStep.addLocation')}
            </button>
          )}
          
          {locationVoteEnabled && validLocations.length < MIN_LOCATIONS && (
            <p className={styles.locationWarning}>
              {t('createMeeting.locationStep.minLocationsWarning')}
            </p>
          )}
        </div>
      )}

      <div className={styles.buttonContainer}>
        <Button buttonType='ghost' onClick={handleBack}>
          {t('common.previous')}
        </Button>
        <Button
          buttonType='primary'
          disabled={!canSubmit || isSubmitting}
          onClick={handleSubmit}
        >
          {t('createMeeting.locationStep.createButton')}
        </Button>
      </div>
    </>
  )
}

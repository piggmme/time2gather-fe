import { useEffect, useState } from 'react'
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
import { useStore } from '@nanostores/react'
import { $me, refreshMe } from '../../stores/me'
import { auth } from '../../services/auth'
import { PlusIcon } from '@radix-ui/react-icons'

const MAX_LOCATIONS = 5
const MIN_LOCATIONS = 2

export default function LocationStep () {
  const [locationVoteEnabled, setLocationVoteEnabled] = useState(false)
  const [locations, setLocations] = useState<string[]>(['', ''])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const me = useStore($me)
  const [hostName, setHostName] = useState(me?.username ?? '')

  useEffect(() => {
    if (me) setHostName(me.username)
  }, [me])

  const [selectedDates] = useSelectedDates()
  const title = useSearchParam('title')
  const meetingTypeParam = useSearchParam('meetingType') as post_meetings_body['selectionType']
  const startTime12Param = useSearchParam('startTime12')
  const endTime12Param = useSearchParam('endTime12')
  const startAmPmParam = useSearchParam('startAmPm') as AmPm
  const endAmPmParam = useSearchParam('endAmPm') as AmPm
  const { t } = useTranslation()

  const validLocations = locations.filter(loc => loc.trim() !== '')
  const hasIdentity = hostName.trim().length > 0
  const canSubmit = hasIdentity && (!locationVoteEnabled || validLocations.length >= MIN_LOCATIONS)

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
      if (!me) {
        await auth.anonymous.post(hostName.trim())
        await refreshMe()
      } else if (hostName.trim() !== me.username) {
        await auth.me.put(hostName.trim())
        await refreshMe()
      }

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
      <h1 className={styles.title}>{t('createMeeting.locationStep.heading')}</h1>

      <section className={styles.formSection} aria-labelledby='creator-section-title'>
        <div className={styles.sectionHeader}>
          <span className={styles.requiredBadge}>{t('createMeeting.locationStep.requiredLabel')}</span>
          <h3 id='creator-section-title'>{t('createMeeting.locationStep.creatorHeading')}</h3>
          <p>{t('createMeeting.locationStep.creatorDescription')}</p>
        </div>

        <div className={styles.identityField}>
          <label htmlFor='meeting-host-name'>{t('createMeeting.locationStep.usernameLabel')}</label>
          <Input
            id='meeting-host-name'
            type='text'
            autoComplete='nickname'
            maxLength={100}
            placeholder={t('createMeeting.locationStep.usernamePlaceholder')}
            value={hostName}
            aria-describedby={me ? 'meeting-host-name-help' : undefined}
            onChange={e => setHostName(e.target.value)}
          />
          {me && (
            <p id='meeting-host-name-help' className={styles.identityHelp}>
              {t('createMeeting.locationStep.usernameChangeHelp')}
            </p>
          )}
        </div>
      </section>

      <section className={styles.formSection} aria-labelledby='location-section-title'>
        <div className={styles.sectionHeader}>
          <span className={styles.optionalBadge}>{t('createMeeting.locationStep.optionalLabel')}</span>
          <h3 id='location-section-title'>{t('createMeeting.locationStep.locationHeading')}</h3>
          <p>{t('createMeeting.locationStep.locationDescription')}</p>
        </div>

        <div className={styles.locationToggleContainer}>
          <label className={styles.locationToggle}>
            <input
              type='checkbox'
              checked={locationVoteEnabled}
              onChange={e => setLocationVoteEnabled(e.target.checked)}
            />
            <span className={styles.locationToggleLabel}>
              {t('createMeeting.locationStep.enableLocationVote')}
            </span>
          </label>
        </div>

        {locationVoteEnabled && (
          <div className={styles.locationInputsContainer}>
            {locations.map((location, index) => (
              <div key={index} className={styles.locationInputRow}>
                <Input
                  placeholder={t('createMeeting.locationStep.locationPlaceholder')}
                  value={location}
                  onChange={e => handleLocationChange(index, e.target.value)}
                />
                {locations.length > MIN_LOCATIONS && (
                  <button
                    type='button'
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
                type='button'
                className={styles.locationAddButton}
                onClick={handleAddLocation}
              >
                <PlusIcon aria-hidden='true' />
                <span>{t('createMeeting.locationStep.addLocation')}</span>
              </button>
            )}

            {validLocations.length < MIN_LOCATIONS && (
              <p className={styles.locationWarning}>
                {t('createMeeting.locationStep.minLocationsWarning')}
              </p>
            )}
          </div>
        )}
      </section>

      <div className={styles.buttonContainer}>
        <Button buttonType='secondary' onClick={handleBack}>
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

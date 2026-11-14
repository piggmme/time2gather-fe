import { useState } from 'react'
import dayjs from 'dayjs'
import { navigateBack } from '../../utils/navigation'
import Monthly from '../Monthly/Monthly'
import Button from '../Button/Button'
import Input from '../Input/Input'
import { meetings, type LocationVoteInfo } from '../../services/meetings'
import { useTranslation } from '../../hooks/useTranslation'
import { showDefaultToast } from '../../stores/toast'
import styles from './EditVotingDatesPage.module.scss'
import timeStyles from './TimeRangeStep.module.scss'

const MAX_DATES = 31

export default function EditVotingDatesPage ({
  meetingCode,
  initialDates,
  availableDates,
  selectionType,
  timezone,
  intervalMinutes = 60,
  candidateVersion,
  locationVote,
}: {
  meetingCode: string
  initialDates: string[]
  availableDates: Record<string, string[]>
  selectionType: 'ALL_DAY' | 'TIME'
  timezone: string
  intervalMinutes?: number
  candidateVersion?: string
  locationVote?: LocationVoteInfo | null
}) {
  const { t } = useTranslation()
  const [selectedDates, setSelectedDates] = useState(() => initialDates
    .map(date => dayjs(date))
    .sort((a, b) => a.diff(b)))
  const isTime = selectionType === 'TIME'
  const initialTimes = [...new Set(Object.values(availableDates).flat())].sort()
  const initialStart = initialTimes[0] ?? '09:00'
  const initialEnd = initialTimes.at(-1) ?? '22:00'
  const [start, setStart] = useState(initialStart)
  const [end, setEnd] = useState(initialEnd)
  const rangeChanged = isTime && (start !== initialStart || end !== initialEnd)
  const minutes = (time: string) => {
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) return NaN
    const [hours, mins] = time.split(':').map(Number)
    return hours * 60 + mins
  }
  const startMinutes = minutes(start)
  const endMinutes = minutes(end)
  const validRange = !isTime || (Number.isFinite(startMinutes) && Number.isFinite(endMinutes)
    && startMinutes <= endMinutes && startMinutes % intervalMinutes === 0 && endMinutes % intervalMinutes === 0)
  const times = validRange && isTime
    ? Array.from({ length: (endMinutes - startMinutes) / intervalMinutes + 1 }, (_, index) => {
        const total = startMinutes + index * intervalMinutes
        return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
      })
    : []
  const [isSaving, setIsSaving] = useState(false)
  const hasPlaces = Boolean(locationVote?.enabled)
  const originalPlaces = locationVote?.locations ?? []
  const [places, setPlaces] = useState(() => originalPlaces.map(place => ({ key: String(place.id), id: String(place.id), name: place.name })))
  const validPlaces = !hasPlaces || (places.length >= 2 && places.length <= 5 && places.every(place => place.name.trim().length > 0 && place.name.trim().length <= 200))
  const removedPlaces = originalPlaces.filter(original => !places.some(place => place.id === String(original.id) && place.name.trim() === original.name))
  const updatePlace = (key: string, name: string) => setPlaces(current => current.map(place => place.key === key ? { ...place, name } : place))
  const selectedDateKeys = selectedDates.map(date => date.format('YYYY-MM-DD'))
  const removedCount = initialDates.filter(date => !selectedDateKeys.includes(date)).length
  const removedTimes = rangeChanged && validRange
    ? Object.entries(availableDates)
        .filter(([date]) => selectedDateKeys.includes(date))
        .reduce((count, [, originalTimes]) => count + originalTimes.filter(time => !times.includes(time)).length, 0)
    : 0
  const text = (key: string) => t(`meeting.editDates.${isTime ? `time${key[0].toUpperCase()}${key.slice(1)}` : key}`)
  const resultUrl = `/meetings/${meetingCode}`

  const handleDatesChange = (dates: dayjs.Dayjs[]) => {
    if (isSaving) return
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
    if (selectedDates.length === 0 || !validRange || !validPlaces || isSaving) return
    setIsSaving(true)
    const finish = async () => {
      showDefaultToast({ message: text('success'), duration: 3000 })
      await navigateBack(resultUrl)
    }
    const body = {
      dates: selectedDateKeys,
      ...(rangeChanged ? { times } : {}),
      ...(hasPlaces ? { locations: places.map(({ id, name }) => ({ ...(id ? { id } : {}), name: name.trim() })) } : {}),
      expectedVersion: candidateVersion ?? '',
    }
    try {
      await meetings.$meetingCode.candidates.put(meetingCode, body)
      await finish()
    } catch (error) {
      // A lost response can follow a successful commit. Re-read before reporting failure.
      try {
        const { data } = await meetings.$meetingCode.get(meetingCode, { suppressErrorToast: true })
        const actualDates = Object.keys(data.meeting.availableDates).sort()
        const expectedDates = [...selectedDateKeys].sort()
        const slotsMatch = !isTime || expectedDates.every((date) => {
          const expected = rangeChanged ? times : availableDates[date] ?? Object.values(availableDates)[0]
          return JSON.stringify([...(data.meeting.availableDates[date] ?? [])].sort()) === JSON.stringify([...(expected ?? [])].sort())
        })
        const actualPlaces = data.locationVote?.locations ?? []
        const placesMatch = !hasPlaces || (actualPlaces.length === places.length && places.every((place, index) => {
          const original = originalPlaces.find(item => String(item.id) === place.id)
          return actualPlaces[index].name === place.name.trim() && (!original || original.name !== place.name.trim() || String(actualPlaces[index].id) === place.id)
        }))
        if (JSON.stringify(actualDates) === JSON.stringify(expectedDates) && slotsMatch && placesMatch) {
          await finish()
          return
        }
      } catch { /* Keep the draft when the committed result cannot be verified. */ }
      console.error('Failed to update voting candidates:', error)
      showDefaultToast({ message: text('error'), duration: 3000 })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.hostBadge}>{t('meeting.editDates.hostOnly')}</span>
        <h1>{text('title')}</h1>
        <p>{text('description')}</p>
      </div>

      <details className={styles.candidateSection} open>
        <summary>{t(isTime ? 'meeting.confirmDialog.scheduleTitle' : 'meeting.result.confirmedPlan.date')}</summary>
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

        {isTime && (
          <section className={styles.timeSection} aria-labelledby='voting-time-heading'>
            <h2 id='voting-time-heading'>{t('createMeeting.timeRangeStep.heading')}</h2>
            <p className={styles.timeHint}>{t('meeting.editDates.timeRangeHint')}</p>
            <fieldset className={styles.timeFields} disabled={isSaving}>
              <div className={timeStyles.timeRangeContainer}>
                <label className={timeStyles.timeRangeItem}>
                  <span>{t('createMeeting.timeRangeStep.startTime')}</span>
                  <input className={timeStyles.nativeTime} type='time' step={intervalMinutes * 60} max={end || undefined} value={start} onChange={event => setStart(event.currentTarget.value)} required />
                </label>
                <label className={timeStyles.timeRangeItem}>
                  <span>{t('createMeeting.timeRangeStep.endTime')}</span>
                  <input className={timeStyles.nativeTime} type='time' step={intervalMinutes * 60} min={start || undefined} value={end} onChange={event => setEnd(event.currentTarget.value)} required />
                </label>
              </div>
            </fieldset>
            <p className={styles.timeHint}>{t('timezone.meeting', { zone: timezone })}</p>
          </section>
        )}

        {removedTimes > 0 && (
          <p className={styles.warning} role='status'>
            {t('meeting.editDates.timeRemovedWarning', { count: removedTimes })}
          </p>
        )}

        {removedCount > 0 && (
          <p className={styles.warning} role='status'>
            {t('meeting.editDates.removedWarning', { count: removedCount })}
          </p>
        )}

      </details>

      {hasPlaces && (
        <details className={styles.candidateSection} open>
          <summary>{t('meeting.result.tabs.location')}</summary>
          <fieldset className={styles.placeFields} disabled={isSaving}>
            {places.map((place, index) => (
              <div className={styles.placeRow} key={place.key}>
                <label className={styles.placeLabel}>
                  <span>{t('meeting.result.tabs.location')} {index + 1}</span>
                  <Input
                    data-location-candidate
                    value={place.name}
                    maxLength={200}
                    placeholder={t('createMeeting.locationStep.locationPlaceholder')}
                    onChange={event => updatePlace(place.key, event.currentTarget.value)}
                    required
                  />
                </label>
                <Button
                  buttonType='danger'
                  aria-label={`${t('createMeeting.locationStep.removeLocation')} ${index + 1}`}
                  disabled={places.length <= 2}
                  onClick={() => setPlaces(current => current.filter(item => item.key !== place.key))}
                >
                  {t('createMeeting.locationStep.removeLocation')}
                </Button>
              </div>
            ))}
            <Button buttonType='add' disabled={places.length >= 5} onClick={() => setPlaces(current => [...current, { key: crypto.randomUUID(), id: '', name: '' }])}>
              {t('createMeeting.locationStep.addLocation')}
            </Button>
          </fieldset>
          <p className={styles.timeHint}>{t('createMeeting.locationStep.minLocationsWarning')}</p>
          {removedPlaces.length > 0 && <p className={styles.warning} role='status'>{t('meeting.editDates.locationRemovedWarning', { count: removedPlaces.length })}</p>}
        </details>
      )}

      <div className={styles.buttons}>
        <Button onClick={() => navigateBack(resultUrl)} disabled={isSaving} buttonType='ghost'>
          {t('common.cancel')}
        </Button>
        <Button
          buttonType='primary'
          disabled={selectedDates.length === 0 || !validRange || !validPlaces || isSaving}
          onClick={handleSave}
        >
          {text('save')}
        </Button>
      </div>
    </div>
  )
}

import { trackMeetingResponseSaved } from '../../utils/meetingAnalytics'
import UnavailableOption from './UnavailableOption'
import { useUnavailableResponse } from '../../hooks/useUnavailableResponse'
import { useStepScrollRestoration } from '../../hooks/useStepScrollRestoration'
import TimezoneNotice from '../Timezone/TimezoneNotice'
import dayjs from 'dayjs'
import { useTranslation } from '../../hooks/useTranslation'
import styles from './SelectPage.module.scss'
import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '../Button/Button'
import { meetings, type get_meetings_$meetingCode_response } from '../../services/meetings'
import { navigateBack } from '../../utils/navigation'
import { showCautionToast, showDefaultToast } from '../../stores/toast'
import Monthly from '../Monthly/Monthly'
import { useStore } from '@nanostores/react'
import { $me } from '../../stores/me'
import LocationVoteSection, { type LocationSelectionStatus } from './LocationVoteSection'
import DateParticipantsPanel from './DateParticipantsPanel'
import { getOtherParticipantCount } from '../../utils/participantCount'

export default function DatesSelectPage (
  { meetingCode, data }:
  { meetingCode: string, data: get_meetings_$meetingCode_response['data'] },
) {
  const { t } = useTranslation()
  const responseSaved = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedDates, setSelectedDates] = useState<dayjs.Dayjs[]>([])
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([])
  const [locationStatus, setLocationStatus] = useState<LocationSelectionStatus>(data.locationVote?.enabled ? 'loading' : 'ready')
  const [focusedDate, setFocusedDate] = useState<dayjs.Dayjs | null>(null)
  const [step, setStep] = useState<'schedule' | 'location'>('schedule')
  const me = useStore($me)
  const locationVote = data.locationVote?.enabled ? data.locationVote : null
  const isLocationStep = step === 'location'
  const responseStatus = me ? data.participants.find(person => person.userId === me.userId)?.availabilityResponse : undefined
  const none = useUnavailableResponse(responseStatus ?? undefined, selectedDates, setSelectedDates, () => [])
  const participantCount = getOtherParticipantCount(
    data.participants,
    me?.userId,
    data.summary.totalParticipants,
  )

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

  const dateSchedule = useMemo(() => {
    const schedule: { [date: string]: { count: number, participants: typeof data.participants } } = {}
    for (const [date, timeSlots] of Object.entries(data.schedule)) {
      const allDaySlot = timeSlots['ALL_DAY']
      if (!allDaySlot) continue
      const includesMe = me ? allDaySlot.participants.some(participant => participant.userId === me.userId) : false
      schedule[date] = {
        count: includesMe ? Math.max(0, allDaySlot.count - 1) : allDaySlot.count,
        participants: allDaySlot.participants,
      }
    }
    return schedule
  }, [data.schedule, data.participants, me])

  const focusedDateKey = focusedDate?.format('YYYY-MM-DD') ?? ''
  const focusedParticipants = focusedDateKey
    ? data.schedule[focusedDateKey]?.ALL_DAY?.participants ?? []
    : []

  const dates = Object.keys(data.meeting.availableDates)

  const moveToStep = useStepScrollRestoration(step, setStep)

  const handleCancel = () => {
    return navigateBack(`/meetings/${meetingCode}`)
  }

  const handleSubmit = async () => {
    try {
      const dateSelectionsPromise = none.unavailable
        ? meetings.$meetingCode.unavailable(meetingCode, Object.keys(data.meeting.availableDates))
        : meetings.$meetingCode.selections.put(meetingCode, {
            selections: selectedDates.map(date => ({
              date: date.format('YYYY-MM-DD'),
              type: 'ALL_DAY',
              times: [],
            })),
          })

      const locationSelectionsPromise = !none.unavailable && locationVote && locationStatus === 'ready'
        ? meetings.$meetingCode.locationSelections.put(meetingCode, { locationIds: selectedLocationIds })
        : Promise.resolve()

      await Promise.all([dateSelectionsPromise, locationSelectionsPromise])
      trackMeetingResponseSaved(data, me?.userId, none.unavailable, responseSaved.current)
      responseSaved.current = true

      setTimeout(() => {
        showDefaultToast({
          message: t('meeting.resultSaved'),
          duration: 3000,
        })
      }, 500)
      await navigateBack(`/meetings/${meetingCode}`)
    } catch (error) {
      const errorResponse = error as { response?: { data?: { messageKey?: string } } }
      if (errorResponse.response?.data?.messageKey === 'error.meeting.already.confirmed') {
        showCautionToast({ message: t('meeting.alreadyConfirmedError'), duration: 4000 })
        await navigateBack(`/meetings/${meetingCode}`)
      } else {
        showDefaultToast({
          message: t('common.error'),
          duration: 3000,
        })
      }
    }
  }

  return (
    <div>
      {locationVote && (
        <p className={styles.stepIndicator} aria-live='polite'>
          {t(isLocationStep ? 'locationVote.locationStepLabel' : 'locationVote.scheduleStepLabel')}
        </p>
      )}

      <div hidden={isLocationStep}>
        <TimezoneNotice zone={data.meeting.timezone} dateOnly />
        <div className={styles.selectedDatesInfo}>
          <span>{t('meeting.participantsCountCompact', { count: participantCount })}</span>
        </div>
        <p className={styles.selectionInstruction}>{t('meeting.selectedDates', { count: dates.length })}</p>
        <div
          className={styles.container}
          ref={containerRef}
        >
          <Monthly
            mode='edit'
            dates={selectedDates}
            setDates={none.select}
            availableDates={Object.keys(data.meeting.availableDates).map(date => dayjs(date))}
            dateSchedule={dateSchedule}
            participantsCount={participantCount}
            onDateClick={setFocusedDate}
          />
        </div>
        <DateParticipantsPanel
          date={focusedDate}
          participants={focusedParticipants}
          me={me}
        />
      </div>

      {!isLocationStep && (
        <UnavailableOption
          checked={none.unavailable}
          onChange={none.toggle}
          time={false}
        />
      )}

      {locationVote && (
        <div className={styles.locationStep} hidden={!isLocationStep}>
          <LocationVoteSection
            meetingCode={meetingCode}
            locations={locationVote.locations}
            confirmedLocation={locationVote.confirmedLocation}
            onSelectionsChange={setSelectedLocationIds}
            onStatusChange={setLocationStatus}
          />
        </div>
      )}
      <div className={`${styles.buttonContainer} ${!isLocationStep ? styles.calendarButtonContainer : ''}`}>
        <Button
          buttonType='ghost'
          onClick={() => {
            if (isLocationStep) return moveToStep('schedule')
            return handleCancel()
          }}
        >
          {t(isLocationStep ? 'common.previous' : 'common.cancel')}
        </Button>
        <Button
          buttonType='primary'
          disabled={(selectedDates.length === 0 && !none.unavailable) || (isLocationStep && locationStatus === 'loading')}
          onClick={() => {
            if (locationVote && !isLocationStep && !none.unavailable) {
              return moveToStep('location')
            }
            return handleSubmit()
          }}
        >
          {t(locationVote && !isLocationStep && !none.unavailable ? 'common.next' : 'common.submit')}
        </Button>
      </div>
    </div>
  )
}

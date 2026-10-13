import dayjs from 'dayjs'
import { useTranslation } from '../../hooks/useTranslation'
import styles from './SelectPage.module.scss'
import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '../Button/Button'
import { meetings, type get_meetings_$meetingCode_response } from '../../services/meetings'
import { navigate } from 'astro:transitions/client'
import { showCautionToast, showDefaultToast } from '../../stores/toast'
import Monthly from '../Monthly/Monthly'
import Input from '../Input/Input'
import { useStore } from '@nanostores/react'
import { $me } from '../../stores/me'
import { auth } from '../../services/auth'
import LocationVoteSection, { type LocationSelectionStatus } from './LocationVoteSection'
import DateParticipantsPanel from './DateParticipantsPanel'
import { useAnonymousMeetingData } from '../../hooks/useAnonymousMeetingData'

export default function AnonymousDatesSelectPage (
  { meetingCode, initialData }:
  { meetingCode: string, initialData: get_meetings_$meetingCode_response['data'] },
) {
  const { t } = useTranslation()
  const { data, status, retry } = useAnonymousMeetingData(meetingCode, initialData)

  if (status === 'checking' || status === 'loading') {
    return <p className={styles.anonymousMeetingState} role='status'>{t('common.loading')}</p>
  }

  if (status === 'error') {
    return (
      <div className={styles.anonymousLoginForm} role='alert'>
        <p>{t('common.error')}</p>
        <Button buttonType='secondary' onClick={retry}>{t('locationVote.retry')}</Button>
      </div>
    )
  }

  if (status === 'login') return <AnonymousLoginForm />
  if (!data) return null

  return <DatesSelectForm data={data} meetingCode={meetingCode} />
}

function AnonymousLoginForm () {
  const { t } = useTranslation()
  const [username, setUsername] = useState<string>('')

  return (
    <div className={styles.anonymousLoginForm}>
      <p>{t('meeting.anonymous.description')}</p>
      <Input
        type='text'
        placeholder={t('meeting.anonymous.usernamePlaceholder')}
        value={username}
        onChange={e => setUsername(e.target.value)}
      />
      <Button
        buttonType='primary'
        disabled={!username.trim()}
        onClick={async () => {
          await auth.anonymous.post(username.trim())
          const response = await auth.me.get()
          if (response.data) {
            $me.set(response.data)
          }
        }}
      >
        {t('meeting.anonymous.anonymousLogin')}
      </Button>
    </div>
  )
}

function DatesSelectForm ({
  data,
  meetingCode,
}: {
  data: get_meetings_$meetingCode_response['data']
  meetingCode: string
}) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const dates = Object.keys(data.meeting.availableDates)
  const [selectedDates, setSelectedDates] = useState<dayjs.Dayjs[]>([])
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([])
  const [locationStatus, setLocationStatus] = useState<LocationSelectionStatus>(data.locationVote?.enabled ? 'loading' : 'ready')
  const [focusedDate, setFocusedDate] = useState<dayjs.Dayjs | null>(null)
  const [step, setStep] = useState<'schedule' | 'location'>('schedule')
  const me = useStore($me)
  const locationVote = data.locationVote?.enabled ? data.locationVote : null
  const isLocationStep = step === 'location'

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

  const moveToStep = (nextStep: 'schedule' | 'location') => {
    setStep(nextStep)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancel = () => {
    if (window.history.length === 1) {
      navigate(`/meetings/${meetingCode}`)
    } else {
      window.history.back()
    }
  }

  const handleSubmit = async () => {
    try {
      const dateSelectionsPromise = meetings.$meetingCode.selections.put(meetingCode, {
        selections: selectedDates.map(date => ({
          date: date.format('YYYY-MM-DD'),
          type: 'ALL_DAY',
          times: [],
        })),
      })
      const locationSelectionsPromise = locationVote && locationStatus === 'ready'
        ? meetings.$meetingCode.locationSelections.put(meetingCode, { locationIds: selectedLocationIds })
        : Promise.resolve()

      await Promise.all([dateSelectionsPromise, locationSelectionsPromise])
      setTimeout(() => {
        showDefaultToast({
          message: t('meeting.resultSaved'),
          duration: 3000,
        })
      }, 500)
      navigate(`/meetings/${meetingCode}`)
    } catch (error) {
      const errorResponse = error as { response?: { data?: { messageKey?: string } } }
      if (errorResponse.response?.data?.messageKey === 'error.meeting.already.confirmed') {
        showCautionToast({ message: t('meeting.alreadyConfirmedError'), duration: 4000 })
        navigate(`/meetings/${meetingCode}`)
      } else {
        showDefaultToast({ message: t('common.error'), duration: 3000 })
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
        <div className={styles.selectedDatesInfo}>
          <span>{t('meeting.anonymous.votingAsCompact', { username: me?.username || '' })}</span>
          <span className={styles.metaDivider} aria-hidden='true'>·</span>
          <span>{t('meeting.participantsCountCompact', { count: data.participants.length })}</span>
        </div>
        <p className={styles.selectionInstruction}>{t('meeting.selectedDates', { count: dates.length })}</p>
        <div
          className={styles.container}
          ref={containerRef}
        >
          <Monthly
            mode='edit'
            dates={selectedDates}
            setDates={setSelectedDates}
            availableDates={Object.keys(data.meeting.availableDates).map(date => dayjs(date))}
            dateSchedule={dateSchedule}
            participantsCount={data.summary.totalParticipants}
            onDateClick={setFocusedDate}
          />
        </div>
        <DateParticipantsPanel
          date={focusedDate}
          participants={focusedParticipants}
          isSelected={Boolean(focusedDate && selectedDates.some(date => date.isSame(focusedDate, 'day')))}
          me={me}
        />
      </div>

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
            if (isLocationStep) moveToStep('schedule')
            else handleCancel()
          }}
        >
          {t(isLocationStep ? 'common.previous' : 'common.cancel')}
        </Button>
        <Button
          buttonType='primary'
          disabled={selectedDates.length === 0 || (isLocationStep && locationStatus === 'loading')}
          onClick={() => {
            if (locationVote && !isLocationStep) {
              moveToStep('location')
              return
            }
            return handleSubmit()
          }}
        >
          {t(locationVote && !isLocationStep ? 'common.next' : 'common.submit')}
        </Button>
      </div>
    </div>
  )
}

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
import Input from '../Input/Input'
import { auth } from '../../services/auth'
import LocationVoteSection, { type LocationSelectionStatus } from './LocationVoteSection'
import { useAnonymousMeetingData } from '../../hooks/useAnonymousMeetingData'

export default function AnonymousTimeSelectPage (
  { meetingCode }:
  { meetingCode: string },
) {
  const { t } = useTranslation()
  const { data, status, retry } = useAnonymousMeetingData(meetingCode)

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

  if (status === 'login') return <AnonymousLoginForm meetingCode={meetingCode} />
  if (!data) return null

  return <TimeSelectForm data={data} meetingCode={meetingCode} />
}

function AnonymousLoginForm ({
  meetingCode,
}: {
  meetingCode: string
}) {
  const { t } = useTranslation()
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')

  return (
    <div className={styles.anonymousLoginForm}>
      <p>{t('meeting.anonymous.description')}</p>
      <Input
        type='text'
        placeholder={t('meeting.anonymous.usernamePlaceholder')}
        value={username}
        onChange={e => setUsername(e.target.value)}
      />
      <Input
        type='password'
        placeholder={t('meeting.anonymous.passwordPlaceholder')}
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <Button
        buttonType='primary'
        onClick={async () => {
          await meetings.$meetingCode.auth.anonymous.post(meetingCode, {
            username,
            password,
          })
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

function TimeSelectForm ({
  data,
  meetingCode,
}: {
  data: get_meetings_$meetingCode_response['data']
  meetingCode: string
}) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<string>('100svh')
  const [selections, setSelections] = useState<{ [date: string]: string[] }>({})
  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([])
  const [locationStatus, setLocationStatus] = useState<LocationSelectionStatus>(data.locationVote?.enabled ? 'loading' : 'ready')
  const [step, setStep] = useState<'schedule' | 'location'>('schedule')
  const locationVote = data.locationVote?.enabled ? data.locationVote : null
  const isLocationStep = step === 'location'

  useEffect(() => {
    if (containerRef.current) {
      // containerRef 의 왼쪽 상단 모서리 위치 계산
      const leftTop = containerRef.current.getBoundingClientRect()
      setHeight(`calc(100svh - ${leftTop.top}px - 30px - 60px)`)
    }
  }, [])

  const me = useStore($me)
  const dates = Object.keys(data.meeting.availableDates)
  const dateList = dates.map(date => dayjs(date)).sort((a, b) => a.diff(b))
  const availableTimes = Object.values(data.meeting.availableDates)[0] || []

  // schedule에서 내가 선택한 날짜와 시간대를 selections의 초기값으로 설정
  useEffect(function initializeSelections () {
    if (!me || !data.schedule) return

    const initialSelections: { [date: string]: string[] } = {}

    for (const [date, timeSlots] of Object.entries(data.schedule)) {
      const selectedTimes: string[] = []

      for (const [time, slot] of Object.entries(timeSlots)) {
        const isMeIncluded = slot.participants.some(p => p.userId === me.userId)
        if (isMeIncluded) {
          selectedTimes.push(time)
        }
      }

      if (selectedTimes.length > 0) {
        initialSelections[date] = selectedTimes
      }
    }

    setSelections(initialSelections)
  }, [me, data.schedule])

  // schedule에서 자신이 포함된 경우 count를 1 낮춤
  const schedule = useMemo(() => {
    if (!me) return undefined

    const processedSchedule: typeof data.schedule = {}
    for (const [date, timeSlots] of Object.entries(data.schedule)) {
      processedSchedule[date] = {}
      for (const [time, slot] of Object.entries(timeSlots)) {
        const isMeIncluded = slot.participants.some(p => p.userId === me.userId)
        processedSchedule[date][time] = {
          ...slot,
          count: isMeIncluded ? Math.max(0, slot.count - 1) : slot.count,
        }
      }
    }
    return processedSchedule
  }, [data.schedule, me])

  const hasTimeSelections = Object.values(selections).some(times => times.length > 0)

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
      const timeSelectionsPromise = meetings.$meetingCode.selections.put(meetingCode, {
        selections: Object.entries(selections).filter(([, times]) => times.length > 0).map(([date, times]) => ({
          date,
          type: 'TIME',
          times,
        })),
      })
      const locationSelectionsPromise = locationVote && locationStatus === 'ready'
        ? meetings.$meetingCode.locationSelections.put(meetingCode, { locationIds: selectedLocationIds })
        : Promise.resolve()

      await Promise.all([timeSelectionsPromise, locationSelectionsPromise])
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
          <p>{t('meeting.anonymous.votingAs', { username: me?.username || '' })}</p>
          <p>{t('meeting.participantsCount', { count: data.participants.length })}</p>
          <p>{t('meeting.selectedDatesAndTimes', { count: dates.length })}</p>
        </div>
        <div
          className={styles.container}
          ref={containerRef}
        >
          <Daily
            dates={dateList}
            availableTimes={availableTimes}
            height={height}
            selections={selections}
            setSelections={setSelections}
            schedule={schedule}
            participantsCount={data.participants.length}
          />
        </div>
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
      <div className={styles.buttonContainer}>
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
          disabled={!hasTimeSelections || (isLocationStep && locationStatus === 'loading')}
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

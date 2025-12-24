import dayjs from 'dayjs'
import { useTranslation } from '../../hooks/useTranslation'
import styles from './SelectPage.module.scss'
import { useRef, useState } from 'react'
import Button from '../Button/Button'
import { meetings, type get_meetings_$meetingCode_response } from '../../services/meetings'
import { navigate } from 'astro:transitions/client'
import { showDefaultToast } from '../../stores/toast'
import Monthly from '../Monthly/Monthly'
import Input from '../Input/Input'

export default function AnonymousDatesSelectPage (
  { meetingCode, data }:
  { meetingCode: string, data: get_meetings_$meetingCode_response['data'] },
) {
  const [step, setStep] = useState<'login' | 'select'>('login')

  return (
    <>
      {step === 'login'
        ? (
            <AnonymousLoginForm
              meetingCode={meetingCode}
              nextStep={() => {
                setStep('select')
              }}
            />
          )
        : <DatesSelectForm data={data} meetingCode={meetingCode} />}
    </>
  )
}

function AnonymousLoginForm ({
  meetingCode,
  nextStep,
}: {
  meetingCode: string
  nextStep: () => void
}) {
  const { t } = useTranslation()
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')

  return (
    <div className={styles.anonymousLoginForm}>
      <p>{t('meeting.annonymous.description')}</p>
      <Input
        type='text'
        placeholder={t('meeting.annonymous.usernamePlaceholder')}
        value={username}
        onChange={e => setUsername(e.target.value)}
      />
      <Input
        type='password'
        placeholder={t('meeting.annonymous.passwordPlaceholder')}
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <Button
        buttonType='primary'
        onClick={async () => {
          await meetings.$meetingCode.auth.anymouse.post(meetingCode, {
            username,
            password,
          })
          nextStep()
        }}
      >
        {t('meeting.annonymous.anonymousLogin')}
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
  const [selectedDates, setSelectedDates] = useState<dayjs.Dayjs[]>([])

  const dates = Object.keys(data.meeting.availableDates)

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
          mode='edit'
          dates={selectedDates}
          setDates={setSelectedDates}
          availableDates={Object.keys(data.meeting.availableDates).map(date => dayjs(date))}
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
          disabled={selectedDates.length === 0}
          onClick={async () => {
            // selections 에서 빈배열인 날짜는 제거
            await meetings.$meetingCode.selections.put(meetingCode, {
              selections: selectedDates.map(date => ({
                date: date.format('YYYY-MM-DD'),
                type: 'ALL_DAY',
                times: [],
              })),
            })
            setTimeout(() => {
              showDefaultToast({
                message: t('meeting.resultSaved'),
                duration: 3000,
              })
            }, 500)
            navigate(`/meetings/${meetingCode}/result`)
          }}
        >
          {t('common.submit')}
        </Button>
      </div>
    </div>
  )
}

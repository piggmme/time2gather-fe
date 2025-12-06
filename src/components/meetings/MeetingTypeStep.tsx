import Button from '../Button/Button'
import styles from './CreateMeeting.module.scss'
import { useTranslation } from '../../hooks/useTranslation'
import { useState } from 'react'
import { navigate } from 'astro:transitions/client'
import { useSearchParam } from 'react-use'

type MeetingType = 'simple' | 'timeRange'

export default function MeetingTypeStep () {
  const { t } = useTranslation()
  const meetingTypeParam = useSearchParam('meetingType')
  const [meetingType, setMeetingType] = useState<MeetingType>(meetingTypeParam as MeetingType || 'simple')

  return (
    <>
      <h2 className={styles.title}>어떤 약속을 잡고싶어요?</h2>
      <div className={styles.meetingTypeContainer}>
        <Button
          buttonType='default'
          className={styles.meetingTypeButton}
          active={meetingType === 'simple'}
          onClick={() => setMeetingType('simple')}
        >
          간단하게 만날 날짜만 📅
        </Button>
        <Button
          buttonType='default'
          className={styles.meetingTypeButton}
          active={meetingType === 'timeRange'}
          onClick={() => setMeetingType('timeRange')}
        >
          만날 날짜와 시간 범위까지 🕒
        </Button>
      </div>
      <div className={styles.buttonContainer}>
        <Button
          buttonType='primary'
          onClick={() => {
            navigate(`/meetings/create?step=title&meetingType=${meetingType}`)
          }}
        >
          {t('common.next')}
        </Button>
      </div>
    </>
  )
}

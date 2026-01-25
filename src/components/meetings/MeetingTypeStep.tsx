import Button from '../Button/Button'
import styles from './CreateMeeting.module.scss'
import { useTranslation } from '../../hooks/useTranslation'
import { useState } from 'react'
import { navigate } from 'astro:transitions/client'
import { useSearchParam } from 'react-use'
import type { post_meetings_body } from '../../services/meetings'

export default function MeetingTypeStep () {
  const { t } = useTranslation()
  const meetingTypeParam = useSearchParam('meetingType') as post_meetings_body['selectionType'] || 'ALL_DAY'
  const [meetingType, setMeetingType] = useState<post_meetings_body['selectionType']>(meetingTypeParam)

  return (
    <>
      <h2 className={styles.title}>어떤 약속을 잡고싶어요?</h2>
      <div className={styles.meetingTypeContainer}>
        <Button
          buttonType='default'
          className={styles.meetingTypeButton}
          active={meetingType === 'ALL_DAY'}
          onClick={() => setMeetingType('ALL_DAY')}
        >
          날짜만 정하기 📅
        </Button>
        <Button
          buttonType='default'
          className={styles.meetingTypeButton}
          active={meetingType === 'TIME'}
          onClick={() => setMeetingType('TIME')}
        >
          날짜 + 시간까지 🕒
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

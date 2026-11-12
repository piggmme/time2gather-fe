import { usePageState } from '../../hooks/usePageState'
import Button from '../Button/Button'
import styles from './CreateMeeting.module.scss'
import { useTranslation } from '../../hooks/useTranslation'
import { navigate } from '../../utils/navigation'
import { useSearchParam } from 'react-use'
import type { post_meetings_body } from '../../services/meetings'
import { HiOutlineCalendar, HiOutlineClock, HiCheck } from 'react-icons/hi'

export default function MeetingTypeStep () {
  const { t } = useTranslation()
  const meetingTypeParam = useSearchParam('meetingType') as post_meetings_body['selectionType'] || 'ALL_DAY'
  const [meetingType, setMeetingType] = usePageState<post_meetings_body['selectionType']>('meetingType', meetingTypeParam)

  return (
    <>
      <h1 className={styles.title}>{t('createMeeting.meetingTypeStep.heading')}</h1>
      <div className={styles.meetingTypeContainer}>
        <Button
          buttonType='default'
          className={styles.meetingTypeButton}
          active={meetingType === 'ALL_DAY'}
          aria-pressed={meetingType === 'ALL_DAY'}
          onClick={() => setMeetingType('ALL_DAY')}
        >
          <HiOutlineCalendar size={24} />
          <span>{t('createMeeting.meetingTypeStep.allDay')}</span>
          <span className={styles.typeSelectionCheck} aria-hidden='true'>{meetingType === 'ALL_DAY' && <HiCheck size={16} />}</span>
        </Button>
        <Button
          buttonType='default'
          className={styles.meetingTypeButton}
          active={meetingType === 'TIME'}
          aria-pressed={meetingType === 'TIME'}
          onClick={() => setMeetingType('TIME')}
        >
          <HiOutlineClock size={24} />
          <span>{t('createMeeting.meetingTypeStep.time')}</span>
          <span className={styles.typeSelectionCheck} aria-hidden='true'>{meetingType === 'TIME' && <HiCheck size={16} />}</span>
        </Button>
      </div>
      <div className={styles.buttonContainer}>
        <Button
          buttonType='primary'
          onClick={() => {
            return navigate(`/meetings/create?step=title&meetingType=${meetingType}`)
          }}
        >
          {t('common.next')}
        </Button>
      </div>
    </>
  )
}

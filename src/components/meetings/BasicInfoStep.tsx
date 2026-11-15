import { useSearchParam } from 'react-use'
import { HiCheck, HiOutlineCalendar, HiOutlineClock, HiOutlineArrowRight } from 'react-icons/hi'
import { usePageState } from '../../hooks/usePageState'
import { useTranslation } from '../../hooks/useTranslation'
import { navigate } from '../../utils/navigation'
import type { post_meetings_body } from '../../services/meetings'
import Button from '../Button/Button'
import Input from '../Input/Input'
import CreateFlowActions from './CreateFlowActions'
import styles from './CreateMeeting.module.scss'

export default function BasicInfoStep () {
  const { t } = useTranslation()
  const titleParam = useSearchParam('title')
  const typeParam = useSearchParam('meetingType')
  const [title, setTitle] = usePageState('title', titleParam ?? '')
  const [meetingType, setMeetingType] = usePageState<post_meetings_body['selectionType']>('meetingType', typeParam === 'TIME' ? 'TIME' : 'ALL_DAY')

  return (
    <section data-create-basic-info>
      <h1 className={`${styles.title} ${styles.basicHeading}`}>{t('createMeeting.basicInfoStep.heading')}</h1>
      <p className={styles.basicDescription}>{t('createMeeting.basicInfoStep.description')}</p>
      <div className={styles.basicTitleField}>
        <label htmlFor='meeting-title'>{t('createMeeting.basicInfoStep.titleLabel')}</label>
        <Input
          id='meeting-title'
          value={title}
          placeholder={t('createMeeting.titleStep.placeholder')}
          onChange={event => setTitle(event.target.value)}
        />
      </div>
      <fieldset className={styles.basicTypeField}>
        <legend>{t('createMeeting.basicInfoStep.typeLabel')}</legend>
        <div className={styles.basicTypeOptions} data-basic-type-options>
          {(['ALL_DAY', 'TIME'] as const).map(type => (
            <Button
              key={type}
              type='button'
              buttonType='default'
              className={styles.basicTypeButton}
              active={meetingType === type}
              aria-pressed={meetingType === type}
              aria-label={t(type === 'ALL_DAY' ? 'createMeeting.meetingTypeStep.allDay' : 'createMeeting.basicInfoStep.timeLabel')}
              aria-describedby={`meeting-type-${type}-hint`}
              data-meeting-type={type}
              onClick={() => setMeetingType(type)}
            >
              {type === 'ALL_DAY' ? <HiOutlineCalendar size={22} aria-hidden='true' /> : <HiOutlineClock size={22} aria-hidden='true' />}
              <span className={styles.basicTypeCopy}>
                <strong>{t(type === 'ALL_DAY' ? 'createMeeting.meetingTypeStep.allDay' : 'createMeeting.basicInfoStep.timeLabel')}</strong>
                <span id={`meeting-type-${type}-hint`}>{t(type === 'ALL_DAY' ? 'createMeeting.basicInfoStep.dateDescription' : 'createMeeting.basicInfoStep.timeDescription')}</span>
              </span>
              <span className={styles.basicTypeCheck} aria-hidden='true'>{meetingType === type && <HiCheck size={14} />}</span>
            </Button>
          ))}
        </div>
      </fieldset>
      <CreateFlowActions>
        <Button
          type='button'
          buttonType='primary'
          disabled={!title.trim()}
          onClick={() => {
            const url = new URL(window.location.href)
            url.searchParams.set('step', 'dates')
            url.searchParams.set('meetingType', meetingType)
            url.searchParams.set('title', title)
            return navigate(url.href)
          }}
        >
          <span>{t('common.next')}</span><HiOutlineArrowRight className={styles.nextArrow} aria-hidden='true' />
        </Button>
      </CreateFlowActions>
    </section>
  )
}

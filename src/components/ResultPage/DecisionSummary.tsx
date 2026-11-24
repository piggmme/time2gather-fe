import { useId, useMemo, useState } from 'react'
import { useStore } from '@nanostores/react'
import { HiChevronDown, HiOutlineCalendar } from 'react-icons/hi'
import { $me } from '../../stores/me'
import { intlLocale } from '../../i18n/config'
import { useTranslation } from '../../hooks/useTranslation'
import type { get_meetings_$meetingCode_response } from '../../services/meetings'
import { buildDecisionSummary } from '../../utils/decisionSummary'
import { formatDate, formatTimeRange } from '../../utils/time'
import ResultPeople from './ResultPeople'
import disclosureStyles from './ResultDisclosure.module.scss'
import Button from '../Button/Button'
import ConfirmMeetingDialog from './ConfirmMeetingDialog'
import styles from './DecisionSummary.module.scss'

type MeetingData = get_meetings_$meetingCode_response['data']

export default function DecisionSummary ({ data, displayZone, onMeetingUpdated }: {
  data: MeetingData
  displayZone: string
  onMeetingUpdated?: () => void
}) {
  const { t, locale } = useTranslation()
  const formatDay = useMemo(() => new Intl.NumberFormat(intlLocale(locale)).format, [locale])
  const year = String(new Date().getFullYear())
  const me = useStore($me)
  const isHost = me?.userId === data.meeting.host.id
  const dateOnly = data.meeting.selectionType === 'ALL_DAY'
  const model = useMemo(() => buildDecisionSummary(data, displayZone), [data, displayZone])
  const [showAll, setShowAll] = useState(false)
  const [open, setOpen] = useState(false)
  const id = useId()
  const options = showAll ? model.options : model.options.slice(0, 3)
  const hasOptions = options.length > 0
  const title = model.state === 'all'
    ? t(dateOnly ? 'meeting.result.decision.allDates' : 'meeting.result.decision.allTimes', { count: model.maxCount })
    : model.state === 'partial'
      ? t('meeting.result.decision.partial', { count: model.maxCount })
      : model.state === 'pending'
        ? t('meeting.result.decision.pending')
        : data.participants.length === 0
          ? t('meeting.participantsEmpty')
          : t(`meeting.result.decision.${dateOnly ? 'emptyDates' : 'emptyTimes'}`)
  const responseGroup = (label: string, people: MeetingData['participants'], status: string) => people.length > 0 && (
    <section className={styles.Missing} data-decision-response={status} aria-label={label}>
      <h3 className={styles.GroupHeading}><span>{label}</span><span className={styles.GroupCount}>{t('meeting.result.participantsCount', { count: people.length })}</span></h3>
      <ResultPeople people={people} />
    </section>
  )

  return (
    <section className={styles.Summary} data-decision-state={model.state} aria-labelledby={`${id}-title`}>
      <div className={styles.Header}>
        <div className={styles.Heading}>
          <p className={styles.Status}>{t('meeting.result.actions.inProgress')}</p>
          <h2 id={`${id}-title`} className={styles.Title}>{title}</h2>
          {hasOptions && (
            <p className={styles.Basis}>{t(model.state === 'partial' ? 'meeting.result.decision.notAll' : 'meeting.result.decision.basis')}</p>
          )}
        </div>
        {isHost && (
          <div className={styles.Toolbar} data-summary-toolbar data-confirm-primary={hasOptions}>
            <Button
              type='button'
              buttonType={hasOptions ? 'primary' : 'secondary'}
              className={styles.ConfirmAction}
              onClick={() => setOpen(true)}
              aria-haspopup='dialog'
              data-summary-confirm
            >
              {t('meeting.result.decision.setMeeting')}
            </Button>
          </div>
        )}
      </div>
      {hasOptions
        ? (
            <>
              <span id={`${id}-people-hint`} className={styles.VisuallyHidden}>{t('meeting.result.decision.people')}</span>
              <ul className={styles.Options} aria-label={t(dateOnly ? 'meeting.result.bestSlotsTitle' : 'meeting.result.bestTimesTitle')}>
                {options.map((option) => {
                  const availableIds = new Set(option.participants.map(person => person.userId))
                  const missing = data.participants.filter(person => !availableIds.has(person.userId) && person.availabilityResponse !== 'NEEDS_RESPONSE')
                  const notSelected = missing.filter(person => person.availabilityResponse !== 'NONE')
                  const unavailable = missing.filter(person => person.availabilityResponse === 'NONE')
                  return (
                    <li key={option.key} className={styles.Option} data-decision-option={option.key}>
                      <details className={styles.People}>
                        <summary className={`${disclosureStyles.Toggle} ${styles.ScheduleToggle}`} aria-describedby={`${id}-people-hint`}>
                          <time className={styles.Date} dateTime={option.date}>
                            <span>{formatDate(option.date, locale, { month: 'short' })}</span>
                            <strong>{formatDay(Number(option.date.slice(8, 10)))}</strong>
                          </time>
                          <span className={styles.DateHeading}>
                            <span className={styles.Weekday}>
                              {formatDate(option.date, locale, option.date.startsWith(year) ? { weekday: 'long' } : { weekday: 'long', year: 'numeric' })}
                            </span>
                            {!dateOnly && (
                              <span className={styles.Time}>
                                <bdi>{formatTimeRange(option.time, locale, '')}</bdi>
                                {option.endDate !== option.date && <span>{formatDate(option.endDate, locale)}</span>}
                              </span>
                            )}
                          </span>
                          <HiChevronDown className={disclosureStyles.Chevron} aria-hidden='true' />
                        </summary>
                        {model.state === 'partial' && <p className={styles.Count}>{t('meeting.result.someAvailable', { count: option.count, total: model.total })}</p>}
                        <ResultPeople people={option.participants} inDetails />
                        {responseGroup(t('meeting.result.decision.notSelected'), notSelected, 'not-selected')}
                        {responseGroup(t('meeting.unavailable.noneStatus'), unavailable, 'none')}
                      </details>
                    </li>
                  )
                })}
              </ul>
              {model.options.length > 3 && (
                <button type='button' className={styles.More} aria-expanded={showAll} onClick={() => setShowAll(value => !value)}>
                  {t(showAll ? 'meeting.result.showFewerOptions' : 'meeting.result.showMoreOptions', { count: model.options.length - 3 })}
                  <HiChevronDown className={disclosureStyles.Chevron} aria-hidden='true' />
                </button>
              )}
              {responseGroup(t('meeting.unavailable.pending'), model.pending, 'pending')}
            </>
          )
        : (
            <div className={styles.Empty} data-empty-schedule>
              {model.state === 'unavailable'
                ? <p>{t('meeting.result.decision.allUnavailable', { count: data.participants.length })}</p>
                : <p>{t('meeting.unavailable.emptyHint')}</p>}
              {responseGroup(t('meeting.unavailable.noneStatus'), data.participants.filter(person => person.availabilityResponse === 'NONE'), 'none')}
              {responseGroup(t('meeting.unavailable.pending'), model.pending, 'pending')}
              {isHost && model.state === 'unavailable' && (
                <Button as='a' buttonType='primary' className={styles.Primary} href={`/meetings/${data.meeting.code}/edit-dates`}>
                  <HiOutlineCalendar aria-hidden='true' />{t(data.meeting.selectionType === 'TIME' ? 'meeting.editDates.timeOpenButton' : 'meeting.editDates.openButton')}
                </Button>
              )}
            </div>
          )}
      {isHost && (
        <ConfirmMeetingDialog
          isOpen={open}
          onClose={() => setOpen(false)}
          onConfirmed={() => onMeetingUpdated ? onMeetingUpdated() : window.location.reload()}
          meetingCode={data.meeting.code}
          timezone={data.meeting.timezone}
          availableDates={data.meeting.availableDates}
          schedule={data.schedule}
          totalParticipants={data.summary.totalParticipants}
          intervalMinutes={data.meeting.intervalMinutes}
          selectionType={data.meeting.selectionType}
          locationVote={data.locationVote}
        />
      )}
    </section>
  )
}

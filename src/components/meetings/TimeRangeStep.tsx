import { usePageState } from '../../hooks/usePageState'
import { useStore } from '@nanostores/react'
import styles from './TimeRangeStep.module.scss'
import flowStyles from './CreateMeeting.module.scss'
import Button from '../Button/Button'
import { navigate, navigateBack } from '../../utils/navigation'
import { useSearchParam } from 'react-use'
import useSelectedDates from './useSelectedDates'
import { useTranslation } from '../../hooks/useTranslation'
import SelectedDates from './SelectedDates'
import TimeZoneSelect from '../Timezone/TimeZoneSelect'
import { $creationTimeZone, setCreationTimeZone } from '../../stores/timezone'
import { convertTo12Hour, convertTo24Hour, type AmPm } from '../../utils/time'

export default function TimeRangeStep () {
  const [selectedDates] = useSelectedDates()
  const title = useSearchParam('title') ?? ''
  const initialStart = useSearchParam('startTime12')
  const initialEnd = useSearchParam('endTime12')
  const initialStartPeriod = useSearchParam('startAmPm') as AmPm | null
  const initialEndPeriod = useSearchParam('endAmPm') as AmPm | null
  const [start, setStart] = usePageState('startTime', initialStart ? convertTo24Hour(initialStart, initialStartPeriod ?? 'AM') : '09:00')
  const [end, setEnd] = usePageState('endTime', initialEnd ? convertTo24Hour(initialEnd, initialEndPeriod ?? 'PM') : '22:00')
  const initialInterval = useSearchParam('intervalMinutes')
  const [intervalMinutes, setIntervalMinutes] = usePageState('intervalMinutes', initialInterval === '30' ? 30 : 60)
  const timezone = useStore($creationTimeZone)
  const { t, locale } = useTranslation()
  const params = () => new URLSearchParams({ meetingType: 'TIME', dates: selectedDates.map(date => date.format('YYYY-MM-DD')).join(','), title, intervalMinutes: String(intervalMinutes) })
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('createMeeting.timeRangeStep.heading')}</h1>
      <div className={styles.timeRangeContainer}>
        <label className={styles.timeRangeItem}>
          <span>{t('createMeeting.timeRangeStep.startTime')}</span>
          <input className={styles.nativeTime} type='time' step={intervalMinutes * 60} value={start} onInput={event => setStart(event.currentTarget.value)} required />
        </label>
        <label className={styles.timeRangeItem}>
          <span>{t('createMeeting.timeRangeStep.endTime')}</span>
          <input className={styles.nativeTime} type='time' step={intervalMinutes * 60} min={start} value={end} onInput={event => setEnd(event.currentTarget.value)} required />
        </label>
      </div>
      <div className={styles.settings}>
        <label className={styles.settingRow}>
          <span className={styles.settingLabel}>{t('createMeeting.timeRangeStep.intervalLabel')}</span>
          <select className={styles.intervalSelect} name='intervalMinutes' value={intervalMinutes} onChange={event => setIntervalMinutes(Number(event.target.value))}>
            <option value='60'>{t('createMeeting.timeRangeStep.hourOption')}</option>
            <option value='30'>{t('createMeeting.timeRangeStep.halfHourOption')}</option>
          </select>
        </label>
        <div className={styles.settingRow}>
          <span className={styles.settingLabel}>{t('timezone.title')}</span>
          <div className={styles.settingValue}>
            <TimeZoneSelect value={timezone} onChange={setCreationTimeZone} description={t('timezone.hint')} field />
          </div>
        </div>
      </div>
      <div className={styles.dateBadgesContainer}>
        <p className={styles.dateBadgesTitle}>{t('createMeeting.timeRangeStep.selectedDatesCount', { count: selectedDates.length })}</p>
        <SelectedDates dates={selectedDates} locale={locale} visibleCount={6} badgeType='default' />
      </div>
      <div className={flowStyles.buttonContainer}>
        <Button
          buttonType='secondary'
          onClick={() => {
            const query = params()
            query.set('step', 'dates')
            return navigateBack(`/meetings/create?${query}`)
          }}
        >{t('common.previous')}
        </Button>
        <Button
          buttonType='primary'
          disabled={!start || !end || start >= end || ![start, end].every(time => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time) && (Number(time.slice(0, 2)) * 60 + Number(time.slice(3))) % intervalMinutes === 0)}
          onClick={() => {
            const query = params()
            const from = convertTo12Hour(start)
            const to = convertTo12Hour(end)
            query.set('step', 'location')
            query.set('startTime12', from.time)
            query.set('endTime12', to.time)
            query.set('startAmPm', from.amPm)
            query.set('endAmPm', to.amPm)
            return navigate(`/meetings/create?${query}`)
          }}
        >{t('common.next')}
        </Button>
      </div>
    </div>
  )
}

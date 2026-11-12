import { useEffect, useId, useRef } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { formatDate, formatTime } from '../../utils/time'
import type { ConfirmationDateGroup, DisplayedConfirmationSlot } from '../../utils/confirmationSlots'
import selectStyles from '../Select/Select.module.scss'
import styles from './ConfirmationSchedule.module.scss'
import dialogStyles from './CalendarExportDialog.module.scss'
import Button from '../Button/Button'

export default function ConfirmationSchedule ({
  groups, selectedSlot, onSelect, timezone, selectionType, recommendations, showingRecommendations, onShowAllDates,
}: {
  groups: ConfirmationDateGroup[]
  selectedSlot?: DisplayedConfirmationSlot
  onSelect: (slot: DisplayedConfirmationSlot) => void
  timezone: string
  selectionType: 'ALL_DAY' | 'TIME'
  recommendations: DisplayedConfirmationSlot[]
  showingRecommendations: boolean
  onShowAllDates: (show: boolean) => void
}) {
  const { t, locale } = useTranslation()
  const dateId = useId()
  const selectedDate = selectedSlot?.displayDate ?? groups[0]?.date
  const group = groups.find(group => group.date === selectedDate)
  const chronologicalGroups = [...groups].sort((a, b) => a.date.localeCompare(b.date))
  const rootRef = useRef<HTMLDivElement>(null)
  const previousView = useRef(showingRecommendations)
  useEffect(() => {
    if (previousView.current !== showingRecommendations) {
      rootRef.current?.querySelector<HTMLElement>(showingRecommendations ? 'input:checked, input' : 'select')?.focus()
      previousView.current = showingRecommendations
    }
  }, [showingRecommendations])

  return (
    <div ref={rootRef} className={styles.schedule}>
      {showingRecommendations
        ? (
            <>
              <fieldset className={styles.times}>
                <legend className={styles.label}>
                  {t('meeting.confirmDialog.scheduleTitle')}
                  {selectionType === 'TIME' && <bdi className={styles.zone}>{timezone}</bdi>}
                </legend>
                <div className={dialogStyles.slotList}>
                  {recommendations.map(slot => (
                    <label key={`${slot.date}/${slot.time}`} className={`${dialogStyles.slotItem} ${styles.recommendation}`}>
                      <input
                        type='radio'
                        name='selectedSlot'
                        value={`${slot.date}/${slot.time}`}
                        checked={selectedSlot?.date === slot.date && selectedSlot?.time === slot.time}
                        onChange={() => onSelect(slot)}
                        className={dialogStyles.radioInput}
                      />
                      <span className={dialogStyles.slotInfo}>
                        <bdi className={dialogStyles.slotDate}>{formatDate(slot.displayDate, locale)}</bdi>
                        {selectionType === 'TIME' && <bdi className={styles.time}>{formatTime(slot.displayTime, locale, '')}</bdi>}
                        <span className={styles.attendance}>{t('meeting.result.voteCount', { count: slot.count, percentage: slot.percentage })}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <Button type='button' buttonType='secondary' className={styles.browseButton} onClick={() => onShowAllDates(true)}>
                {t('meeting.confirmDialog.allDates', { count: groups.length })}
              </Button>
            </>
          )
        : (
            <>
              {recommendations.length > 0 && (
                <Button type='button' buttonType='ghost' className={styles.backButton} onClick={() => onShowAllDates(false)}>
                  {t('meeting.confirmDialog.backToRecommendations')}
                </Button>
              )}
              <div className={styles.dateField}>
                <label className={styles.label} htmlFor={dateId}>{t('meeting.result.confirmedPlan.date')}</label>
                <select
                  id={dateId}
                  className={`${selectStyles.Trigger} ${styles.dateSelect}`}
                  value={selectedDate}
                  onChange={(event) => {
                    const slots = groups.find(group => group.date === event.target.value)?.slots
                    const best = slots?.reduce((best, slot) => slot.count > best.count ? slot : best)
                    if (best) onSelect(best)
                  }}
                >
                  {chronologicalGroups.map(group => (
                    <option key={group.date} value={group.date}>
                      {formatDate(group.date, locale)}
                    </option>
                  ))}
                </select>
              </div>
              {selectionType === 'TIME'
                ? (
                    <fieldset className={styles.times}>
                      <legend className={styles.label}>
                        {t('meeting.result.confirmedPlan.time')} <bdi className={styles.zone}>{timezone}</bdi>
                      </legend>
                      <div className={styles.timeGrid}>
                        {group?.slots.map(slot => (
                          <label key={`${slot.date}/${slot.time}`} className={styles.timeOption}>
                            <input
                              type='radio'
                              name='selectedSlot'
                              value={`${slot.date}/${slot.time}`}
                              checked={selectedSlot?.date === slot.date && selectedSlot?.time === slot.time}
                              onChange={() => onSelect(slot)}
                            />
                            <bdi className={styles.time}>{formatTime(slot.displayTime, locale, '')}</bdi>
                            <span className={styles.attendance}>{t('meeting.result.voteCount', { count: slot.count, percentage: slot.percentage })}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  )
                : selectedSlot && (
                  <p className={styles.dayAttendance}>
                    {t('meeting.result.confirmedPlan.attendees')}: {t('meeting.result.voteCount', { count: selectedSlot.count, percentage: selectedSlot.percentage })}
                  </p>
                )}
            </>
          )}
    </div>
  )
}

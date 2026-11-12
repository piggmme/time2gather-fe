import { trackAnalyticsEvent } from '../../utils/analytics'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Dialog } from '../Dialog/Dialog'
import { meetings, type LocationVoteInfo } from '../../services/meetings'
import { useTranslation } from '../../hooks/useTranslation'
import { useStore } from '@nanostores/react'
import { $locale } from '../../stores/locale'
import { formatDate, formatTime } from '../../utils/time'
import styles from './CalendarExportDialog.module.scss'
import { showDefaultToast } from '../../stores/toast'

import { buildConfirmationSlots, groupConfirmationSlots, recommendConfirmationSlots } from '../../utils/confirmationSlots'
import type { get_meetings_$meetingCode_response } from '../../services/meetings'
import { localeMeta } from '../../i18n/config'
import { useDisplayTimeZone } from '../../hooks/useDisplayTimeZone'
import ConfirmationSchedule from './ConfirmationSchedule'
import scheduleStyles from './ConfirmationSchedule.module.scss'

type ConfirmMeetingDialogProps = {
  isOpen: boolean
  onClose: () => void
  onConfirmed: () => void
  meetingCode: string
  timezone: string
  availableDates: get_meetings_$meetingCode_response['data']['meeting']['availableDates']
  schedule: get_meetings_$meetingCode_response['data']['schedule']
  totalParticipants: number
  intervalMinutes?: number
  selectionType: 'ALL_DAY' | 'TIME'
  locationVote: LocationVoteInfo | null
}

export default function ConfirmMeetingDialog ({
  isOpen,
  onClose,
  onConfirmed,
  meetingCode,
  timezone,
  availableDates,
  schedule,
  totalParticipants,
  intervalMinutes = 60,
  selectionType,
  locationVote,
}: ConfirmMeetingDialogProps) {
  const { t } = useTranslation()
  const locale = useStore($locale)
  const [displayZone] = useDisplayTimeZone(timezone)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)
  const [step, setStep] = useState<'schedule' | 'location'>('schedule')
  const [showAllDates, setShowAllDates] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const dialogBodyRef = useRef<HTMLDivElement>(null)

  const choices = useMemo(() => buildConfirmationSlots(availableDates, schedule, totalParticipants, selectionType, intervalMinutes),
    [availableDates, schedule, totalParticipants, selectionType, intervalMinutes])

  const grouped = useMemo(() => groupConfirmationSlots(choices, timezone, displayZone), [choices, timezone, displayZone])
  const recommendations = useMemo(() => recommendConfirmationSlots(grouped.groups), [grouped.groups])
  const showingRecommendations = !showAllDates && recommendations.length > 0

  const sortedLocations = useMemo(() => {
    if (!locationVote?.enabled) return []

    return [...locationVote.locations].sort((a, b) =>
      b.voteCount - a.voteCount || a.displayOrder - b.displayOrder,
    )
  }, [locationVote])

  useEffect(() => {
    if (!isOpen) return

    setSelectedKey(null)
    setStep('schedule')
    setShowAllDates(false)
    setSelectedLocationId(
      locationVote?.confirmedLocation ? String(locationVote.confirmedLocation.id) : null,
    )
  }, [isOpen, meetingCode, locationVote?.confirmedLocation?.id])

  useEffect(() => {
    if (isOpen && selectedKey === null && choices[0]) {
      setSelectedKey(`${choices[0].date}/${choices[0].time}`)
    }
  }, [isOpen, selectedKey, choices])

  useEffect(() => {
    dialogBodyRef.current?.scrollTo({ top: 0 })
  }, [step, showingRecommendations])

  const requiresLocation = locationVote?.enabled === true
  const selectedSlot = selectedKey === null ? choices[0] : choices.find(slot => `${slot.date}/${slot.time}` === selectedKey)
  const displayedSlot = grouped.groups.flatMap(group => group.slots).find(slot => slot.date === selectedSlot?.date && slot.time === selectedSlot?.time)
  const canConfirm = !!selectedSlot && (!requiresLocation || sortedLocations.some(location => String(location.id) === selectedLocationId))

  const handleConfirm = async () => {
    if (!canConfirm || !selectedSlot) return

    setIsLoading(true)
    try {
      const slotIndex = selectionType === 'ALL_DAY'
        ? null
        : selectedSlot.startSlotIndex

      await meetings.$meetingCode.confirm.put(meetingCode, {
        date: selectedSlot.date,
        slotIndex,
        ...(selectedLocationId !== null && { locationId: selectedLocationId }),
      })

      trackAnalyticsEvent('meeting_confirmed', {
        selection_type: selectionType,
        actor_role: 'host',
        location_vote_enabled: requiresLocation,
      })
      showDefaultToast({
        message: t('meeting.confirmDialog.success'),
        duration: 3000,
      })
      onConfirmed()
      onClose()
    } catch (error) {
      console.error('Failed to confirm meeting:', error)
      showDefaultToast({
        message: t('meeting.confirmDialog.error'),
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (choices.length === 0) {
    return (
      <Dialog.Root open={isOpen} onOpenChange={onClose}>
        <Dialog.Content dir={localeMeta[locale].dir}>
          <Dialog.Title>{t('meeting.confirmDialog.title')}</Dialog.Title>
          <Dialog.Description>
            {t('meeting.confirmDialog.noSlots')}
          </Dialog.Description>
          <div className={styles.dialogButtons}>
            <Dialog.Cancel onClick={onClose}>
              {t('meeting.confirmDialog.close')}
            </Dialog.Cancel>
          </div>
        </Dialog.Content>
      </Dialog.Root>
    )
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Content className={styles.dialogContent} dir={localeMeta[locale].dir}>
        <div className={styles.dialogHeader}>
          <Dialog.Title>{t('meeting.confirmDialog.title')}</Dialog.Title>
          <Dialog.Description>
            {step === 'schedule'
              ? showingRecommendations
                ? t('meeting.confirmDialog.recommendationsDescription')
                : selectionType === 'TIME'
                  ? t('meeting.confirmDialog.groupedDescription', { count: grouped.groups.length })
                  : t('meeting.confirmDialog.allCandidatesDescription', { count: choices.length })
              : t('meeting.confirmDialog.locationStepDescription')}
          </Dialog.Description>
          {requiresLocation && (
            <ol className={styles.stepIndicator} aria-label={t('meeting.confirmDialog.progressLabel')}>
              <li
                className={step === 'schedule' ? styles.activeStep : styles.completedStep}
                aria-current={step === 'schedule' ? 'step' : undefined}
              >
                <span>1</span>
                {t('meeting.confirmDialog.scheduleTitle')}
              </li>
              <li
                className={step === 'location' ? styles.activeStep : ''}
                aria-current={step === 'location' ? 'step' : undefined}
              >
                <span>2</span>
                {t('meeting.confirmDialog.locationTitle')}
              </li>
            </ol>
          )}
        </div>

        <div ref={dialogBodyRef} className={styles.dialogBody}>
          {step === 'schedule'
            ? (
                <ConfirmationSchedule
                  groups={grouped.groups}
                  selectedSlot={displayedSlot}
                  onSelect={slot => setSelectedKey(`${slot.date}/${slot.time}`)}
                  timezone={grouped.timezone}
                  selectionType={selectionType}
                  recommendations={recommendations}
                  showingRecommendations={showingRecommendations}
                  onShowAllDates={setShowAllDates}
                />
              )
            : (
                <fieldset className={styles.selectionSection}>
                  <legend className={styles.sectionTitle}>
                    {t('meeting.confirmDialog.locationTitle')}
                  </legend>
                  <p className={styles.sectionDescription}>
                    {t('meeting.confirmDialog.locationDescription')}
                  </p>
                  {sortedLocations.length > 0
                    ? (
                        <div className={styles.slotList}>
                          {sortedLocations.map(location => (
                            <label key={String(location.id)} className={styles.slotItem}>
                              <input
                                type='radio'
                                name='selectedLocation'
                                value={String(location.id)}
                                checked={selectedLocationId === String(location.id)}
                                onChange={() => setSelectedLocationId(String(location.id))}
                                className={styles.radioInput}
                              />
                              <span className={styles.slotInfo}>
                                <span className={styles.slotDate}>{location.name}</span>
                              </span>
                              <span className={styles.slotStats}>
                                {t('meeting.confirmDialog.locationVoteCount', { count: location.voteCount })}
                              </span>
                            </label>
                          ))}
                        </div>
                      )
                    : (
                        <p className={styles.emptyMessage}>
                          {t('meeting.confirmDialog.noLocations')}
                        </p>
                      )}
                </fieldset>
              )}
        </div>

        {displayedSlot && (
          <p className={scheduleStyles.selectionSummary}>
            <bdi>{formatDate(displayedSlot.displayDate, locale)}</bdi>
            {selectionType === 'TIME' && (
              <>
                <bdi>{formatTime(displayedSlot.displayTime, locale, '')}</bdi>
                <bdi className={scheduleStyles.zone}>{grouped.timezone}</bdi>
              </>
            )}
          </p>
        )}

        <div className={styles.dialogButtons}>
          <Dialog.Cancel
            onClick={(event) => {
              if (step === 'location') {
                event.preventDefault()
                setStep('schedule')
                return
              }
              onClose()
            }}
            disabled={isLoading}
          >
            {step === 'location'
              ? t('common.previous')
              : t('meeting.confirmDialog.cancel')}
          </Dialog.Cancel>
          <Dialog.Action
            onClick={(event) => {
              event.preventDefault()
              if (step === 'schedule' && requiresLocation) {
                setStep('location')
                return
              }
              void handleConfirm()
            }}
            disabled={isLoading || !selectedSlot || (step === 'location' && !canConfirm)}
          >
            {isLoading
              ? t('meeting.confirmDialog.confirming')
              : step === 'schedule' && requiresLocation
                ? t('common.next')
                : t('meeting.confirmDialog.confirm')}
          </Dialog.Action>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { Dialog } from '../Dialog/Dialog'
import { meetings, type LocationVoteInfo } from '../../services/meetings'
import { useTranslation } from '../../hooks/useTranslation'
import { useStore } from '@nanostores/react'
import { $locale } from '../../stores/locale'
import { formatDate } from '../../utils/time'
import styles from './CalendarExportDialog.module.scss'
import { showDefaultToast } from '../../stores/toast'

type BestSlot = {
  date: string
  time: string
  startSlotIndex: number
  endSlotIndex: number
  count: number
  percentage: string
}

type ConfirmMeetingDialogProps = {
  isOpen: boolean
  onClose: () => void
  onConfirmed: () => void
  meetingCode: string
  bestSlots: BestSlot[]
  selectionType: 'ALL_DAY' | 'TIME'
  locationVote: LocationVoteInfo | null
}

export default function ConfirmMeetingDialog ({
  isOpen,
  onClose,
  onConfirmed,
  meetingCode,
  bestSlots,
  selectionType,
  locationVote,
}: ConfirmMeetingDialogProps) {
  const { t } = useTranslation()
  const locale = useStore($locale)
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null)
  const [step, setStep] = useState<'schedule' | 'location'>('schedule')
  const [isLoading, setIsLoading] = useState(false)
  const dialogBodyRef = useRef<HTMLDivElement>(null)

  const sortedLocations = useMemo(() => {
    if (!locationVote?.enabled) return []

    return [...locationVote.locations].sort((a, b) =>
      b.voteCount - a.voteCount || a.displayOrder - b.displayOrder,
    )
  }, [locationVote])

  useEffect(() => {
    if (!isOpen) return

    setSelectedIndex(0)
    setStep('schedule')
    setSelectedLocationId(
      locationVote?.confirmedLocation?.id ?? null,
    )
  }, [isOpen, locationVote?.confirmedLocation?.id, sortedLocations])

  useEffect(() => {
    dialogBodyRef.current?.scrollTo({ top: 0 })
  }, [step])

  const requiresLocation = locationVote?.enabled === true
  const canConfirm = bestSlots.length > 0 && (!requiresLocation || selectedLocationId !== null)

  const handleConfirm = async () => {
    if (!canConfirm) return

    setIsLoading(true)
    try {
      const selectedSlot = bestSlots[selectedIndex]
      const slotIndex = selectionType === 'ALL_DAY'
        ? null
        : selectedSlot.startSlotIndex

      await meetings.$meetingCode.confirm.put(meetingCode, {
        date: selectedSlot.date,
        slotIndex,
        ...(selectedLocationId !== null && { locationId: selectedLocationId }),
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

  if (bestSlots.length === 0) {
    return (
      <Dialog.Root open={isOpen} onOpenChange={onClose}>
        <Dialog.Content>
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
      <Dialog.Content className={styles.dialogContent}>
        <div className={styles.dialogHeader}>
          <Dialog.Title>{t('meeting.confirmDialog.title')}</Dialog.Title>
          <Dialog.Description>
            {step === 'schedule'
              ? t('meeting.confirmDialog.description', { count: bestSlots.length })
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
                <fieldset className={styles.selectionSection}>
                  <legend className={styles.sectionTitle}>
                    {t('meeting.confirmDialog.scheduleTitle')}
                  </legend>
                  <p className={styles.sectionDescription}>
                    {t('meeting.confirmDialog.scheduleDescription')}
                  </p>
                  <div className={styles.slotList}>
                    {bestSlots.map((slot, index) => {
                      const formattedDate = formatDate(slot.date, locale)
                      const timeDisplay = selectionType === 'ALL_DAY'
                        ? t('meeting.confirmDialog.allDay')
                        : slot.time

                      return (
                        <label key={`${slot.date}-${slot.time}`} className={styles.slotItem}>
                          <input
                            type='radio'
                            name='selectedSlot'
                            value={index}
                            checked={selectedIndex === index}
                            onChange={() => setSelectedIndex(index)}
                            className={styles.radioInput}
                          />
                          <span className={styles.slotInfo}>
                            <span className={styles.slotDate}>{formattedDate}</span>
                            <span className={styles.slotTime}>{timeDisplay}</span>
                          </span>
                          <span className={styles.slotStats}>
                            {t('meeting.result.voteCount', { count: slot.count, percentage: slot.percentage })}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </fieldset>
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
                            <label key={location.id} className={styles.slotItem}>
                              <input
                                type='radio'
                                name='selectedLocation'
                                value={location.id}
                                checked={selectedLocationId === location.id}
                                onChange={() => setSelectedLocationId(location.id)}
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
            disabled={isLoading || (step === 'location' && !canConfirm)}
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

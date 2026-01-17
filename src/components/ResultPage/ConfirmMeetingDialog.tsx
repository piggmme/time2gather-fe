import { useState } from 'react'
import { Dialog } from '../Dialog/Dialog'
import { meetings } from '../../services/meetings'
import { useTranslation } from '../../hooks/useTranslation'
import { useStore } from '@nanostores/react'
import { $locale } from '../../stores/locale'
import { formatDate } from '../../utils/time'
import dayjs from 'dayjs'
import styles from './CalendarExportDialog.module.scss'
import { showDefaultToast } from '../../stores/toast'

type BestSlot = {
  date: string
  time: string
  count: number
  percentage: string
}

type ConfirmMeetingDialogProps = {
  isOpen: boolean
  onClose: () => void
  onConfirmed: () => void
  meetingCode: string
  meetingTitle: string
  bestSlots: BestSlot[]
  selectionType: 'ALL_DAY' | 'TIME'
}

export default function ConfirmMeetingDialog({
  isOpen,
  onClose,
  onConfirmed,
  meetingCode,
  meetingTitle,
  bestSlots,
  selectionType,
}: ConfirmMeetingDialogProps) {
  const { t } = useTranslation()
  const locale = useStore($locale)
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)

  // 상위 3개만 표시
  const topSlots = bestSlots.slice(0, 3)

  const handleConfirm = async () => {
    if (topSlots.length === 0) return

    setIsLoading(true)
    try {
      const selectedSlot = topSlots[selectedIndex]
      const slotIndex = selectionType === 'ALL_DAY'
        ? null
        : meetings.timeToSlotIndex(selectedSlot.time)

      await meetings.$meetingCode.confirm.put(meetingCode, {
        date: selectedSlot.date,
        slotIndex,
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

  if (topSlots.length === 0) {
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
        <Dialog.Title>{t('meeting.confirmDialog.title')}</Dialog.Title>
        <Dialog.Description>
          {t('meeting.confirmDialog.description')}
        </Dialog.Description>

        <div className={styles.slotList}>
          {topSlots.map((slot, index) => {
            const formattedDate = formatDate(slot.date, locale)
            const timeDisplay = selectionType === 'ALL_DAY'
              ? t('meeting.confirmDialog.allDay')
              : slot.time

            return (
              <label key={`${slot.date}-${slot.time}`} className={styles.slotItem}>
                <input
                  type="radio"
                  name="selectedSlot"
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
                  {slot.count}{t('meeting.result.people')} ({slot.percentage})
                </span>
              </label>
            )
          })}
        </div>

        <div className={styles.dialogButtons}>
          <Dialog.Cancel onClick={onClose} disabled={isLoading}>
            {t('meeting.confirmDialog.cancel')}
          </Dialog.Cancel>
          <Dialog.Action onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? t('meeting.confirmDialog.confirming') : t('meeting.confirmDialog.confirm')}
          </Dialog.Action>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  )
}

import { useState } from 'react'
import { Dialog } from '../Dialog/Dialog'
import { meetings } from '../../services/meetings'
import { useTranslation } from '../../hooks/useTranslation'
import { useStore } from '@nanostores/react'
import { $locale } from '../../stores/locale'
import { formatDate } from '../../utils/time'
import dayjs from 'dayjs'
import styles from './CalendarExportDialog.module.scss'

type BestSlot = {
  date: string
  time: string
  count: number
  percentage: string
}

type CalendarExportDialogProps = {
  isOpen: boolean
  onClose: () => void
  meetingCode: string
  meetingTitle: string
  bestSlots: BestSlot[]
  selectionType: 'ALL_DAY' | 'TIME'
}

export default function CalendarExportDialog({
  isOpen,
  onClose,
  meetingCode,
  meetingTitle,
  bestSlots,
  selectionType,
}: CalendarExportDialogProps) {
  const { t } = useTranslation()
  const locale = useStore($locale)
  const [selectedIndex, setSelectedIndex] = useState<number>(0)

  const handleExport = () => {
    if (bestSlots.length === 0) return

    const selectedSlot = bestSlots[selectedIndex]
    const slotIndex = selectionType === 'ALL_DAY'
      ? -1
      : meetings.timeToSlotIndex(selectedSlot.time)

    const exportUrl = meetings.getExportUrl(meetingCode, selectedSlot.date, slotIndex)

    // ICS 파일 다운로드 - iOS/macOS에서는 .ics 파일이 자동으로 캘린더 앱에서 열림
    window.location.href = exportUrl
    onClose()
  }

  if (bestSlots.length === 0) {
    return (
      <Dialog.Root open={isOpen} onOpenChange={onClose}>
        <Dialog.Content>
          <Dialog.Title>{t('meeting.exportDialog.title')}</Dialog.Title>
          <Dialog.Description>
            {t('meeting.exportDialog.noSlots')}
          </Dialog.Description>
          <div className={styles.dialogButtons}>
            <Dialog.Cancel onClick={onClose}>
              {t('meeting.exportDialog.close')}
            </Dialog.Cancel>
          </div>
        </Dialog.Content>
      </Dialog.Root>
    )
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Content className={styles.dialogContent}>
        <Dialog.Title>{t('meeting.exportDialog.title')}</Dialog.Title>
        <Dialog.Description>
          {t('meeting.exportDialog.description')}
        </Dialog.Description>

        <div className={styles.slotList}>
          {bestSlots.map((slot, index) => {
            const formattedDate = formatDate(slot.date, locale)
            const timeDisplay = selectionType === 'ALL_DAY'
              ? t('meeting.exportDialog.allDay')
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
          <Dialog.Cancel onClick={onClose}>
            {t('meeting.exportDialog.cancel')}
          </Dialog.Cancel>
          <Dialog.Action onClick={handleExport}>
            {t('meeting.exportDialog.confirm')}
          </Dialog.Action>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  )
}

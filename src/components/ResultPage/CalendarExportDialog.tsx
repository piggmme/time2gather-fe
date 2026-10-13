import { useEffect, useState } from 'react'
import { Dialog } from '../Dialog/Dialog'
import { meetings } from '../../services/meetings'
import { useTranslation } from '../../hooks/useTranslation'
import { useStore } from '@nanostores/react'
import { $locale } from '../../stores/locale'
import { formatDate } from '../../utils/time'
import styles from './CalendarExportDialog.module.scss'

type BestSlot = {
  date: string
  time: string
  startSlotIndex: number
  endSlotIndex: number
  count: number
  percentage: string
}

type CalendarExportDialogProps = {
  isOpen: boolean
  onClose: () => void
  meetingCode: string
  bestSlots: BestSlot[]
  selectionType: 'ALL_DAY' | 'TIME'
  initialDate?: string | null
  initialTime?: string | null
}

const isIosDevice = () => {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export default function CalendarExportDialog ({
  isOpen,
  onClose,
  meetingCode,
  bestSlots,
  selectionType,
  initialDate,
  initialTime,
}: CalendarExportDialogProps) {
  const { t } = useTranslation()
  const locale = useStore($locale)
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const isIos = isIosDevice()
  const confirmedBestSlot = initialDate
    ? bestSlots.find((slot) => {
        const [slotStart] = slot.time.split(' ~ ')
        return slot.date === initialDate && slotStart === (initialTime ?? 'ALL_DAY')
      })
    : undefined
  const displayedSlots = initialDate
    ? [{
        date: initialDate,
        time: initialTime ?? 'ALL_DAY',
        startSlotIndex: confirmedBestSlot?.startSlotIndex ?? -1,
        endSlotIndex: confirmedBestSlot?.endSlotIndex ?? -1,
        count: confirmedBestSlot?.count ?? 0,
        percentage: confirmedBestSlot?.percentage ?? '',
      }]
    : bestSlots

  useEffect(() => {
    if (!isOpen || !initialDate) return

    const targetTime = initialTime ?? 'ALL_DAY'
    const confirmedIndex = bestSlots.findIndex((slot) => {
      const [slotStart] = slot.time.split(' ~ ')
      return slot.date === initialDate && slotStart === targetTime
    })

    if (confirmedIndex >= 0) setSelectedIndex(confirmedIndex)
  }, [bestSlots, initialDate, initialTime, isOpen])

  const handleExport = () => {
    if (displayedSlots.length === 0) return

    if (initialDate) {
      window.location.href = meetings.getExportUrl(meetingCode)
      onClose()
      return
    }

    const selectedSlot = displayedSlots[selectedIndex]
    const slotIndex = selectionType === 'ALL_DAY'
      ? -1
      : selectedSlot.startSlotIndex

    const exportUrl = meetings.getExportUrl(meetingCode, selectedSlot.date, slotIndex)

    // ICS 파일 다운로드 - iOS/macOS에서는 .ics 파일이 자동으로 캘린더 앱에서 열림
    window.location.href = exportUrl
    onClose()
  }

  if (displayedSlots.length === 0) {
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

        {isIos && (
          <div className={styles.iosGuide} role='note'>
            <strong>{t('meeting.exportDialog.iosGuideTitle')}</strong>
            <span>{t('meeting.exportDialog.iosGuideDescription')}</span>
          </div>
        )}

        <div className={styles.dialogBody}>
          <div className={styles.slotList}>
            {displayedSlots.map((slot, index) => {
              const formattedDate = formatDate(slot.date, locale)
              const timeDisplay = slot.time === 'ALL_DAY'
                ? t('meeting.exportDialog.allDay')
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
                  {slot.percentage && (
                    <span className={styles.slotStats}>
                      {t('meeting.result.voteCount', { count: slot.count, percentage: slot.percentage })}
                    </span>
                  )}
                </label>
              )
            })}
          </div>
        </div>

        <div className={styles.dialogButtons}>
          <Dialog.Cancel onClick={onClose}>
            {t('meeting.exportDialog.cancel')}
          </Dialog.Cancel>
          <Dialog.Action onClick={handleExport}>
            {t(isIos ? 'meeting.exportDialog.openIosCalendar' : 'meeting.exportDialog.confirm')}
          </Dialog.Action>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  )
}

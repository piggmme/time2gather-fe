import { useState } from 'react'
import { useStore } from '@nanostores/react'
import { $me } from '../../stores/me'
import type { get_meetings_$meetingCode_response } from '../../services/meetings'
import Button from '../Button/Button'
import { useTranslation } from '../../hooks/useTranslation'
import { showDefaultToast } from '../../stores/toast'
import CalendarExportDialog from './CalendarExportDialog'
import ConfirmMeetingDialog from './ConfirmMeetingDialog'

export default function ResultButtons (
  { data, onMeetingUpdated }:
  { data: get_meetings_$meetingCode_response['data'], onMeetingUpdated?: () => void },
) {
  const me = useStore($me)
  const didIParticipate = data.participants.some(participant => participant.userId === me?.userId)
  const isHost = data.meeting.host.id === me?.userId
  const { t } = useTranslation()
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)

  const handleConfirmed = () => {
    // 페이지 새로고침하여 확정 상태 반영
    if (onMeetingUpdated) {
      onMeetingUpdated()
    } else {
      window.location.reload()
    }
  }

  return (
    <>
      {/* 1. 호스트에게만 약속 확정 버튼 표시 */}
      {isHost && (
        <Button
          buttonType='primary'
          onClick={() => setIsConfirmDialogOpen(true)}
        >
          {t('meeting.confirmButton')}
        </Button>
      )}
      {/* 2. 내 캘린더로 옮기기 */}
      <Button
        buttonType='secondary'
        onClick={() => setIsExportDialogOpen(true)}
      >
        {t('meeting.exportToCalendar')}
      </Button>
      {/* 3. 시간 수정하러 가기 */}
      <Button
        as='a'
        href={`/meetings/${data.meeting.code}/select/${data.meeting.selectionType.toLowerCase()}` + (me?.provider === 'ANONYMOUS' ? '?anonymous=true' : '')}
        buttonType='ghost'
      >
        {didIParticipate ? t('meeting.modifyButton') : t('meeting.selectButton')}
      </Button>
      {/* 4. 결과 공유하기 */}
      <Button
        buttonType='ghost'
        onClick={() => {
          navigator.clipboard.writeText(window.location.href)
          showDefaultToast({
            message: t('meeting.shareSuccess'),
            duration: 3000,
          })
        }}
      >
        {t('meeting.shareResult')}
      </Button>

      <CalendarExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        meetingCode={data.meeting.code}
        meetingTitle={data.meeting.title}
        bestSlots={data.summary.bestSlots}
        selectionType={data.meeting.selectionType}
      />

      <ConfirmMeetingDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirmed={handleConfirmed}
        meetingCode={data.meeting.code}
        meetingTitle={data.meeting.title}
        bestSlots={data.summary.bestSlots}
        selectionType={data.meeting.selectionType}
      />
    </>
  )
}

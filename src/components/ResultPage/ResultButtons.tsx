import { useState } from 'react'
import { useStore } from '@nanostores/react'
import { $me } from '../../stores/me'
import type { get_meetings_$meetingCode_response } from '../../services/meetings'
import Button from '../Button/Button'
import { useTranslation } from '../../hooks/useTranslation'
import { showDefaultToast } from '../../stores/toast'
import CalendarExportDialog from './CalendarExportDialog'

export default function ResultButtons (
  { data }:
  { data: get_meetings_$meetingCode_response['data'] },
) {
  const me = useStore($me)
  const didIParticipate = data.participants.some(participant => participant.userId === me?.userId)
  const { t } = useTranslation()
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)

  return (
    <>
      <Button
        buttonType='primary'
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
      <Button
        buttonType='secondary'
        onClick={() => setIsExportDialogOpen(true)}
      >
        {t('meeting.exportToCalendar')}
      </Button>
      <Button
        as='a'
        href={`/meetings/${data.meeting.code}/select/${data.meeting.selectionType.toLowerCase()}` + (me?.provider === 'ANONYMOUS' ? '?anonymous=true' : '')}
        buttonType='ghost'
      >
        {didIParticipate ? t('meeting.modifyButton') : t('meeting.selectButton')}
      </Button>

      <CalendarExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        meetingCode={data.meeting.code}
        meetingTitle={data.meeting.title}
        bestSlots={data.summary.bestSlots}
        selectionType={data.meeting.selectionType}
      />
    </>
  )
}

import { useStore } from '@nanostores/react'
import { $me } from '../../stores/me'
import type { get_meetings_$meetingCode_response } from '../../services/meetings'
import Button from '../Button/Button'
import { useTranslation } from '../../hooks/useTranslation'
import LoginDialog from '../LoginDialog/LoginDialog'
import { useState } from 'react'

export default function MeetingButtons (
  { data }:
  { data: get_meetings_$meetingCode_response['data'] },
) {
  const me = useStore($me)
  const didIParticipate = data.participants.some(participant => participant.userId === me?.userId)
  const { t } = useTranslation()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  if (didIParticipate) return (
    <>
      <Button
        as='a'
        href={`/meetings/${data.meeting.code}/result`}
        buttonType={didIParticipate ? 'primary' : 'ghost'}
      >
        {t('meeting.resultButton')}
      </Button>
      <Button
        as='a'
        href={`/meetings/${data.meeting.code}/select/${data.meeting.selectionType.toLowerCase()}` + (me?.provider === 'ANONYMOUS' ? '?anonymous=true' : '')}
        buttonType='ghost'
      >
        {t('meeting.modifyButton')}
      </Button>
    </>
  )

  return (
    <>
      <Button
        as='a'
        onClick={(e) => {
          if (!me) {
            e.preventDefault()
            setIsDialogOpen(true)
          }
        }}
        href={`/meetings/${data.meeting.code}/select/${data.meeting.selectionType.toLowerCase()}` + (me?.provider === 'ANONYMOUS' ? '?anonymous=true' : '')}
        buttonType='primary'
      >
        {data.meeting.selectionType === 'ALL_DAY'
          ? t('meeting.selectButton')
          : t('meeting.selectTimeButton')}
      </Button>
      <Button
        as='a'
        href={`/meetings/${data.meeting.code}/result`}
        buttonType={didIParticipate ? 'primary' : 'ghost'}
      >
        {t('meeting.resultButton')}
      </Button>
      <LoginDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        meetingCode={data.meeting.code}
        selectionType={data.meeting.selectionType}
      />
    </>
  )
}

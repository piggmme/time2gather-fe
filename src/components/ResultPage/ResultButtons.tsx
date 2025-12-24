import { useStore } from '@nanostores/react'
import { $me } from '../../stores/me'
import type { get_meetings_$meetingCode_response } from '../../services/meetings'
import Button from '../Button/Button'
import { useTranslation } from '../../hooks/useTranslation'
import { showDefaultToast } from '../../stores/toast'

export default function ResultButtons (
  { data }:
  { data: get_meetings_$meetingCode_response['data'] },
) {
  const me = useStore($me)
  const didIParticipate = data.participants.some(participant => participant.userId === me?.userId)
  const { t } = useTranslation()

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
        as='a'
        href={`/meetings/${data.meeting.code}/select/${data.meeting.selectionType.toLowerCase()}` + (me?.provider === 'ANONYMOUS' ? '?anonymous=true' : '')}
        buttonType='ghost'
      >
        {didIParticipate ? t('meeting.modifyButton') : t('meeting.selectButton')}
      </Button>
    </>
  )
}

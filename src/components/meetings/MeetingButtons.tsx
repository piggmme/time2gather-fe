import { useStore } from '@nanostores/react'
import { $me } from '../../stores/me'
import type { get_meetings_$meetingCode_response } from '../../services/meetings'
import Button from '../Button/Button'
import { useTranslation } from '../../hooks/useTranslation'

export default function MeetingButtons (
  { data }:
  { data: get_meetings_$meetingCode_response['data'] },
) {
  const me = useStore($me)
  const didIParticipate = data.participants.some(participant => participant.userId === me?.userId)
  const { t } = useTranslation()

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
        href={`/meetings/${data.meeting.code}/select/${data.meeting.selectionType.toLowerCase()}`}
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
        href={`/meetings/${data.meeting.code}/select/${data.meeting.selectionType.toLowerCase()}`}
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
    </>
  )
}

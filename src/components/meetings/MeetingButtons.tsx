import { useStore } from '@nanostores/react'
import { $me } from '../../stores/me'
import type { get_meetings_$meetingCode_response } from '../../services/meetings'
import Button from '../Button/Button'
import { useTranslation } from '../../hooks/useTranslation'
import { Dialog } from '../Dialog/Dialog'
import { useState } from 'react'
import styles from './MeetingButtons.module.scss'
import { navigate } from 'astro:transitions/client'

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
      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Content>
          <Dialog.Title>{t('meeting.anonymous.dialog.title')}</Dialog.Title>
          <Dialog.Description>{t('meeting.anonymous.dialog.description')}</Dialog.Description>
          <div className={styles.dialogButtons}>
            <Dialog.Action
              className={styles.anonymousLoginButton}
              onClick={() => {
                navigate(`/meetings/${data.meeting.code}/select/${data.meeting.selectionType.toLowerCase()}?anonymous=true`)
              }}
            >{t('meeting.anonymous.dialog.anonymousLogin')}
            </Dialog.Action>
            <Dialog.Action
              className={styles.kakaoLoginButton}
              onClick={() => {
                navigate(`/login?redirect=/meetings/${data.meeting.code}/select/${data.meeting.selectionType.toLowerCase()}`)
              }}
            >{t('meeting.anonymous.dialog.kakaoLoginButton')}
            </Dialog.Action>
          </div>
        </Dialog.Content>
      </Dialog.Root>
    </>
  )
}

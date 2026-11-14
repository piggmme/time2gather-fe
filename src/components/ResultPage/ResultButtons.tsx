import { trackAnalyticsEvent } from '../../utils/analytics'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '@nanostores/react'
import { $me } from '../../stores/me'
import { meetings, type get_meetings_$meetingCode_response } from '../../services/meetings'
import Button from '../Button/Button'
import { useTranslation } from '../../hooks/useTranslation'
import { showDefaultToast } from '../../stores/toast'
import CalendarExportDialog from './CalendarExportDialog'
import ConfirmMeetingDialog from './ConfirmMeetingDialog'
import {
  HiOutlineCalendar, HiOutlineShare, HiOutlinePencil, HiOutlineChevronRight, HiOutlineChevronLeft,
} from 'react-icons/hi'
import { localeMeta } from '../../i18n/config'
import { Dialog } from '../Dialog/Dialog'
import { getMeetingShareContent, getShareCopyText, shareOrCopy, type CreatorShareLabels } from '../../utils/share'
import { hasUserScheduleSelection } from '../../utils/meetingSelection'
import styles from './ResultButtons.module.scss'

export default function ResultButtons (
  { data, shareLabels, onMeetingUpdated, showConfirmAction = true }:
  { data: get_meetings_$meetingCode_response['data'], shareLabels: CreatorShareLabels | null, onMeetingUpdated?: () => void, showConfirmAction?: boolean },
) {
  const me = useStore($me)
  const didIParticipate = hasUserScheduleSelection(data.schedule, me?.userId) || Boolean(me && data.participants.find(person => person.userId === me.userId)?.availabilityResponse)
  const isHost = data.meeting.host.id === me?.userId
  const isConfirmed = !!data.meeting.confirmedDate
  const { t, locale } = useTranslation()
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)
  const [cancelError, setCancelError] = useState(false)
  const [manualShareText, setManualShareText] = useState('')
  const manualShareRef = useRef<HTMLTextAreaElement>(null)
  const [confirmActionTarget, setConfirmActionTarget] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setConfirmActionTarget(document.getElementById('meeting-confirm-action'))
  }, [data.meeting.code])

  const handleConfirmed = () => {
    // 페이지 새로고침하여 확정 상태 반영
    if (onMeetingUpdated) {
      onMeetingUpdated()
    } else {
      window.location.reload()
    }
  }

  const handleCancelConfirmation = async () => {
    if (isCancelling) return

    setIsCancelling(true)
    setCancelError(false)
    try {
      await meetings.$meetingCode.confirm.delete(data.meeting.code)
      setIsCancelConfirmOpen(false)
      showDefaultToast({
        message: t('meeting.cancelConfirmSuccess'),
        duration: 3000,
      })
      if (onMeetingUpdated) {
        onMeetingUpdated()
      } else {
        window.location.reload()
      }
    } catch {
      setCancelError(true)
      showDefaultToast({
        message: t('meeting.cancelConfirmError'),
        duration: 3000,
      })
    } finally {
      setIsCancelling(false)
    }
  }

  const handleExportToCalendar = () => {
    // iOS의 ICS 미리보기에서 실제 저장 버튼 위치를 안내하고,
    // 확정된 일정이 여러 후보 중 하나여도 정확히 선택되도록 항상 다이얼로그를 거친다.
    setIsExportDialogOpen(true)
  }

  const handleShare = async () => {
    const content = getMeetingShareContent(data, shareLabels, window.location.origin)
    const result = await shareOrCopy(content, navigator)
    if (result === 'shared' || result === 'copied') {
      trackAnalyticsEvent('meeting_share_action', {
        selection_type: data.meeting.selectionType,
        actor_role: isHost ? 'host' : 'participant',
        share_method: result === 'shared' ? 'native' : 'clipboard',
        meeting_state: isConfirmed ? 'confirmed' : 'voting',
      })
    }
    if (result === 'manual') {
      setManualShareText(getShareCopyText(content))
    } else if (result === 'copied') {
      showDefaultToast({
        message: isConfirmed ? t('meeting.result.share.detailsCopied') : t('meeting.shareSuccess'),
        duration: 3000,
      })
    }
  }

  const modifyUrl = `/meetings/${data.meeting.code}/select/${data.meeting.selectionType.toLowerCase()}`
  const voteActionLabel = t(`meeting.result.buttons.${didIParticipate ? 'editAvailability' : 'enterAvailability'}`)

  return (
    <div className={styles.ResultButtons}>
      {showConfirmAction && isHost && !isConfirmed && confirmActionTarget && createPortal(
        <Button
          type='button'
          buttonType='utility'
          className={styles.CompactConfirmButton}
          onClick={() => setIsConfirmDialogOpen(true)}
          aria-haspopup='dialog'
        >
          {t('meeting.confirmButtonShort')}
        </Button>,
        confirmActionTarget,
      )}
      <div className={styles.ActionPanel}>
        <div className={styles.ActionPanelIntro}>
          <div className={styles.ActionPanelHeader}>
            <h2 className={styles.ActionPanelHeading}>{t('meeting.result.actions.manage')}</h2>
            {!isConfirmed && (
              <span className={styles.ActionPanelEyebrow} role='status' data-pending>
                {t('meeting.result.actions.inProgress')}
              </span>
            )}
          </div>

        </div>

        {/* 주최자의 날짜 관리는 결과 영역에 유지한다. */}
        {isHost && !isConfirmed && (
          <div className={styles.HostActions}>
            <Button
              as='a'
              href={`/meetings/${data.meeting.code}/edit-dates`}
              buttonType='secondary'
              className={styles.PrimaryButton}
            >
              <HiOutlineCalendar className={styles.ActionButtonIcon} aria-hidden='true' />
              <span className={styles.EditDatesLabel}>{t(data.meeting.selectionType === 'TIME' ? 'meeting.editDates.timeOpenButton' : 'meeting.editDates.openButton')}</span>
              {localeMeta[locale].dir === 'rtl' ? <HiOutlineChevronLeft aria-hidden='true' /> : <HiOutlineChevronRight aria-hidden='true' />}
            </Button>
          </div>
        )}
        {/* 개인 투표 행동은 방장용 투표 날짜 관리와 별도 버튼으로 분리 */}
        {!isConfirmed && (
          <Button
            as='a'
            href={modifyUrl}
            buttonType={didIParticipate ? 'secondary' : 'primary'}
            className={styles.VoteActionButton}
          >
            <HiOutlinePencil className={styles.ActionButtonIcon} aria-hidden='true' />
            {voteActionLabel}
          </Button>
        )}

        {/* 아이콘 버튼 그룹 */}
        <div className={styles.IconButtonGroup} data-confirmed={isConfirmed}>
          {isConfirmed && (
            <Button
              buttonType='primary'
              onClick={handleShare}
              className={styles.ConfirmedShareButton}
            >
              <HiOutlineShare className={styles.ActionButtonIcon} aria-hidden='true' />
              {t('meeting.result.buttons.shareConfirmed')}
            </Button>
          )}
          {/* 캘린더 */}
          <Button
            buttonType='utility'
            className={styles.IconButton}
            onClick={handleExportToCalendar}
            type='button'
          >
            <HiOutlineCalendar className={styles.Icon} aria-hidden='true' />
            <span className={styles.IconLabel}>{t('meeting.result.buttons.calendar')}</span>
          </Button>

          {!isConfirmed && (
            <Button
              buttonType='utility'
              className={styles.IconButton}
              onClick={handleShare}
              type='button'
            >
              <HiOutlineShare className={styles.Icon} aria-hidden='true' />
              <span className={styles.IconLabel}>{t('meeting.result.buttons.share')}</span>
            </Button>
          )}

        </div>

        {isHost && isConfirmed && (
          <button
            type='button'
            onClick={(event) => {
              event.currentTarget.focus({ preventScroll: true })
              setCancelError(false)
              setIsCancelConfirmOpen(true)
            }}
            className={styles.CancelConfirmationButton}
            disabled={isCancelling}
            aria-busy={isCancelling || undefined}
          >
            {t('meeting.cancelConfirmButton')}
          </button>
        )}
      </div>

      <Dialog.Root open={isCancelConfirmOpen} onOpenChange={(open) => { if (!isCancelling) setIsCancelConfirmOpen(open) }}>
        <Dialog.Content dir={localeMeta[locale].dir}>
          <Dialog.Title>{t('meeting.result.confirmedPlan.cancelTitle')}</Dialog.Title>
          <Dialog.Description>{t('meeting.result.confirmedPlan.cancelDescription')}</Dialog.Description>
          {cancelError && <p role='alert' className={styles.CancelError}>{t('meeting.cancelConfirmError')}</p>}
          <div className={styles.CancelDialogActions}>
            <Dialog.Cancel disabled={isCancelling}>{t('meeting.result.confirmedPlan.keepConfirmation')}</Dialog.Cancel>
            <Dialog.Action
              className={styles.CancelDialogConfirm}
              disabled={isCancelling}
              onClick={(event) => {
                event.preventDefault()
                void handleCancelConfirmation()
              }}
            >
              {t('meeting.cancelConfirmButton')}
            </Dialog.Action>
          </div>
        </Dialog.Content>
      </Dialog.Root>

      <Dialog.Root open={!!manualShareText} onOpenChange={(open) => { if (!open) setManualShareText('') }}>
        <Dialog.Content
          dir={localeMeta[locale].dir}
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            manualShareRef.current?.focus()
            manualShareRef.current?.select()
          }}
        >
          <Dialog.Title>{t('common.share')}</Dialog.Title>
          <Dialog.Description>{t('meeting.result.share.manualCopyDescription')}</Dialog.Description>
          <textarea
            ref={manualShareRef}
            className={styles.ManualShareText}
            aria-label={t('common.share')}
            dir='auto'
            readOnly
            value={manualShareText}
            onFocus={event => event.currentTarget.select()}
          />
          <div className={styles.dialogButtons}>
            <Dialog.Cancel>{t('common.close')}</Dialog.Cancel>
          </div>
        </Dialog.Content>
      </Dialog.Root>

      <CalendarExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        meetingCode={data.meeting.code}
        timezone={data.meeting.timezone}
        bestSlots={data.summary.bestSlots}
        selectionType={data.meeting.selectionType}
        initialDate={data.meeting.confirmedDate}
        initialTime={data.meeting.confirmedTime}
      />

      <ConfirmMeetingDialog
        schedule={data.schedule}
        totalParticipants={data.summary.totalParticipants}
        intervalMinutes={data.meeting.intervalMinutes}
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirmed={handleConfirmed}
        meetingCode={data.meeting.code}
        timezone={data.meeting.timezone}
        availableDates={data.meeting.availableDates}
        selectionType={data.meeting.selectionType}
        locationVote={data.locationVote}
      />
    </div>
  )
}

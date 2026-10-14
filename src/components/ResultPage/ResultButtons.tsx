import { useState } from 'react'
import { useStore } from '@nanostores/react'
import { $me } from '../../stores/me'
import { meetings, type get_meetings_$meetingCode_response } from '../../services/meetings'
import Button from '../Button/Button'
import { useTranslation } from '../../hooks/useTranslation'
import { showDefaultToast } from '../../stores/toast'
import CalendarExportDialog from './CalendarExportDialog'
import ConfirmMeetingDialog from './ConfirmMeetingDialog'
import { HiOutlineCalendar, HiOutlineShare, HiOutlinePencil, HiArrowRight } from 'react-icons/hi'
import { formatDate, formatTime } from '../../utils/time'
import { hasUserScheduleSelection } from '../../utils/meetingSelection'
import styles from './ResultButtons.module.scss'

export default function ResultButtons (
  { data, onMeetingUpdated }:
  { data: get_meetings_$meetingCode_response['data'], onMeetingUpdated?: () => void },
) {
  const me = useStore($me)
  const didIParticipate = hasUserScheduleSelection(data.schedule, me?.userId)
  const isHost = data.meeting.host.id === me?.userId
  const isConfirmed = !!data.meeting.confirmedDate
  const { t, locale } = useTranslation()
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

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
    try {
      await meetings.$meetingCode.confirm.delete(data.meeting.code)
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

  const getShareContent = () => {
    const url = window.location.href

    if (!isConfirmed) {
      return {
        title: data.meeting.title,
        text: `${data.meeting.title}\n${t('meeting.result.kakaoShare.description')}`,
        url,
      }
    }

    const details = [
      `📅 ${formatDate(data.meeting.confirmedDate!, locale)}`,
      `🕐 ${formatTime(data.meeting.confirmedTime ?? 'ALL_DAY', locale, t('meeting.confirmDialog.allDay'))}`,
    ]
    const location = data.locationVote?.enabled
      ? data.locationVote.confirmedLocation?.name ?? t('meeting.result.kakaoShare.locationPending')
      : null

    if (location) details.push(`📍 ${location}`)

    return {
      title: t('meeting.result.share.confirmedTitle', { title: data.meeting.title }),
      text: `${t('meeting.result.share.confirmedHeading')}\n${details.join('\n')}`,
      url,
    }
  }

  const handleShare = async () => {
    const shareContent = getShareContent()

    if (navigator.share) {
      try {
        await navigator.share(shareContent)
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }

    await navigator.clipboard.writeText(`${shareContent.text}\n${shareContent.url}`)
    showDefaultToast({
      message: isConfirmed ? t('meeting.result.share.detailsCopied') : t('meeting.shareSuccess'),
      duration: 3000,
    })
  }

  const modifyUrl = `/meetings/${data.meeting.code}/select/${data.meeting.selectionType.toLowerCase()}`
  const voteActionLabel = data.meeting.selectionType === 'ALL_DAY'
    ? t(`meeting.result.buttons.${didIParticipate ? 'modifyDates' : 'selectDates'}`)
    : t(`meeting.result.buttons.${didIParticipate ? 'modifyTimes' : 'selectTimes'}`)

  return (
    <div className={styles.ResultButtons}>
      <div className={styles.ActionPanel}>
        <span className={styles.ActionPanelEyebrow}>
          {t(`meeting.result.actions.${isConfirmed ? 'confirmed' : 'inProgress'}`)}
        </span>
        <p className={styles.ActionPanelTitle}>
          {t(`meeting.result.actions.${isConfirmed ? 'confirmedDescription' : 'inProgressDescription'}`)}
        </p>

        {/* Primary 버튼: 호스트에게만 약속 확정/취소 버튼 표시 */}
        {isHost && !isConfirmed && (
          <div className={styles.HostActions}>
            <Button
              buttonType='primary'
              onClick={() => setIsConfirmDialogOpen(true)}
              className={styles.PrimaryButton}
            >
              {t('meeting.confirmButton')}
            </Button>
            <Button
              as='a'
              href={`/meetings/${data.meeting.code}/edit-dates`}
              buttonType='secondary'
              className={styles.PrimaryButton}
            >
              {t('meeting.editDates.openButton')}
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

        {/* 아이콘 버튼 그룹 */}
        <div className={styles.IconButtonGroup}>
          {/* 캘린더 */}
          <button
            className={styles.IconButton}
            onClick={handleExportToCalendar}
            type='button'
          >
            <HiOutlineCalendar className={styles.Icon} />
            <span className={styles.IconLabel}>{t('meeting.result.buttons.calendar')}</span>
          </button>

          {!isConfirmed && (
            <button
              className={styles.IconButton}
              onClick={handleShare}
              type='button'
            >
              <HiOutlineShare className={styles.Icon} />
              <span className={styles.IconLabel}>{t('meeting.result.buttons.share')}</span>
            </button>
          )}

        </div>

        {isHost && isConfirmed && (
          <button
            type='button'
            onClick={handleCancelConfirmation}
            className={styles.CancelConfirmationButton}
            disabled={isCancelling}
          >
            {t('meeting.cancelConfirmButton')}
          </button>
        )}
      </div>

      <CalendarExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        meetingCode={data.meeting.code}
        bestSlots={data.summary.bestSlots}
        selectionType={data.meeting.selectionType}
        initialDate={data.meeting.confirmedDate}
        initialTime={data.meeting.confirmedTime}
      />

      <ConfirmMeetingDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirmed={handleConfirmed}
        meetingCode={data.meeting.code}
        bestSlots={data.summary.bestSlots}
        selectionType={data.meeting.selectionType}
        locationVote={data.locationVote}
      />

      {/* 바이럴 CTA 섹션 */}
      <div className={styles.ViralCtaSection}>
        <span className={styles.ViralCtaTitle}>{t('meeting.result.viralCta.title')}</span>
        <a href='/' className={styles.ViralCtaButton}>
          {t('meeting.result.viralCta.button')}
          <HiArrowRight aria-hidden='true' />
        </a>
      </div>
    </div>
  )
}

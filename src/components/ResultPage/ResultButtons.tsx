import { useState, useEffect } from 'react'
import { useStore } from '@nanostores/react'
import { $me } from '../../stores/me'
import { meetings, type get_meetings_$meetingCode_response } from '../../services/meetings'
import Button from '../Button/Button'
import { useTranslation } from '../../hooks/useTranslation'
import { showDefaultToast } from '../../stores/toast'
import CalendarExportDialog from './CalendarExportDialog'
import ConfirmMeetingDialog from './ConfirmMeetingDialog'
import LoginDialog from '../LoginDialog/LoginDialog'
import { HiOutlineCalendar, HiOutlineShare, HiOutlinePencil, HiOutlineSparkles } from 'react-icons/hi'
import { RiKakaoTalkFill } from 'react-icons/ri'
import { shareToKakao, isKakaoAvailable } from '../../utils/kakaoShare'
import styles from './ResultButtons.module.scss'

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
  const [isAnonymousDialogOpen, setIsAnonymousDialogOpen] = useState(false)
  const [kakaoAvailable, setKakaoAvailable] = useState(false)

  useEffect(() => {
    // 카카오 SDK 초기화 확인 (약간의 지연 후 체크)
    const checkKakao = () => {
      setKakaoAvailable(isKakaoAvailable())
    }
    checkKakao()
    // SDK 로딩이 늦을 수 있으므로 재확인
    const timer = setTimeout(checkKakao, 1000)
    return () => clearTimeout(timer)
  }, [])

  const handleConfirmed = () => {
    // 페이지 새로고침하여 확정 상태 반영
    if (onMeetingUpdated) {
      onMeetingUpdated()
    } else {
      window.location.reload()
    }
  }

  const handleExportToCalendar = () => {
    const { confirmedDate, confirmedTime } = data.meeting

    // 확정된 날짜가 있으면 바로 캘린더로 이동
    if (confirmedDate && confirmedTime) {
      const slotIndex = confirmedTime === 'ALL_DAY'
        ? -1
        : meetings.timeToSlotIndex(confirmedTime)

      const exportUrl = meetings.getExportUrl(data.meeting.code, confirmedDate, slotIndex)
      window.location.href = exportUrl
      return
    }

    // 확정된 날짜가 없으면 다이얼로그 표시
    setIsExportDialogOpen(true)
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    showDefaultToast({
      message: t('meeting.shareSuccess'),
      duration: 3000,
    })
  }

  const handleShareKakao = () => {
    const success = shareToKakao({
      title: data.meeting.title,
      description: t('meeting.result.kakaoShare.description'),
      url: window.location.href,
      buttonTitle: t('meeting.result.kakaoShare.buttonTitle'),
    })

    if (!success) {
      // 카카오 공유 실패 시 일반 공유로 폴백
      handleShare()
    }
  }

  const modifyUrl = `/meetings/${data.meeting.code}/select/${data.meeting.selectionType.toLowerCase()}` + (me?.provider === 'ANONYMOUS' ? '?anonymous=true' : '')

  const handleModifyClick = (e: React.MouseEvent) => {
    if (!me) {
      e.preventDefault()
      setIsAnonymousDialogOpen(true)
    }
  }

  return (
    <div className={styles.ResultButtons}>
      {/* Primary 버튼: 호스트에게만 약속 확정 버튼 표시 */}
      {isHost && (
        <Button
          buttonType='primary'
          onClick={() => setIsConfirmDialogOpen(true)}
          className={styles.PrimaryButton}
        >
          {t('meeting.confirmButton')}
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

        {/* 카카오톡 공유 */}
        {kakaoAvailable && (
          <button
            className={`${styles.IconButton} ${styles.KakaoButton}`}
            onClick={handleShareKakao}
            type='button'
          >
            <RiKakaoTalkFill className={styles.Icon} />
            <span className={styles.IconLabel}>{t('meeting.result.buttons.shareKakao')}</span>
          </button>
        )}

        {/* 공유 */}
        <button
          className={styles.IconButton}
          onClick={handleShare}
          type='button'
        >
          <HiOutlineShare className={styles.Icon} />
          <span className={styles.IconLabel}>{t('meeting.result.buttons.share')}</span>
        </button>

        {/* 수정 */}
        <a
          className={styles.IconButton}
          href={modifyUrl}
          onClick={handleModifyClick}
        >
          <HiOutlinePencil className={styles.Icon} />
          <span className={styles.IconLabel}>
            {didIParticipate ? t('meeting.result.buttons.modify') : t('meeting.result.buttons.select')}
          </span>
        </a>
      </div>

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

      <LoginDialog
        isOpen={isAnonymousDialogOpen}
        onOpenChange={setIsAnonymousDialogOpen}
        meetingCode={data.meeting.code}
        selectionType={data.meeting.selectionType}
      />

      {/* 바이럴 CTA 섹션 */}
      <div className={styles.ViralCtaSection}>
        <span className={styles.ViralCtaTitle}>{t('meeting.result.viralCta.title')}</span>
        <a href="/" className={styles.ViralCtaButton}>
          <HiOutlineSparkles />
          {t('meeting.result.viralCta.button')}
        </a>
      </div>
    </div>
  )
}

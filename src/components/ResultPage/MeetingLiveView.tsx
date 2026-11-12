import { meetingProfileChanged } from '../../services/meetingProfile'
import Comments from '../Comments/Comments'
import { useTranslation } from '../../hooks/useTranslation'
import commentStyles from '../Comments/Comments.module.scss'
import { HiOutlineChatAlt2 } from 'react-icons/hi'
import TimezoneNotice from '../Timezone/TimezoneNotice'
import { useCallback, useEffect, useRef, useState } from 'react'
import { meetings, type get_meetings_$meetingCode_response } from '../../services/meetings'
import type { CreatorShareLabels } from '../../utils/share'
import ResultButtons from './ResultButtons'
import ResultContent from './ResultContent'
import styles from './MeetingLiveView.module.scss'

type MeetingData = get_meetings_$meetingCode_response['data']

const REFRESH_INTERVAL_MS = 5000

export default function MeetingLiveView ({ initialData, shareLabels }: { initialData: MeetingData, shareLabels: CreatorShareLabels | null }) {
  const { t } = useTranslation()
  const [commentCount, setCommentCount] = useState(0)
  const onCommentSummary = useCallback((count: number) => setCommentCount(count), [])
  const [meetingData, setMeetingData] = useState(initialData)
  const latestSnapshotRef = useRef(JSON.stringify(initialData))
  const isRefreshingRef = useRef(false)
  const isMountedRef = useRef(true)

  const refreshMeeting = useCallback(async () => {
    if (isRefreshingRef.current || document.visibilityState === 'hidden') return

    isRefreshingRef.current = true
    try {
      const response = await meetings.$meetingCode.get(initialData.meeting.code, {
        suppressErrorToast: true,
      })
      const nextSnapshot = JSON.stringify(response.data)

      if (isMountedRef.current && nextSnapshot !== latestSnapshotRef.current) {
        latestSnapshotRef.current = nextSnapshot
        setMeetingData(response.data)
      }
    } catch {
      // 자동 갱신 실패는 현재 데이터를 유지하고 다음 주기에 다시 시도한다.
    } finally {
      isRefreshingRef.current = false
    }
  }, [initialData.meeting.code])

  useEffect(() => {
    isMountedRef.current = true
    const intervalId = window.setInterval(refreshMeeting, REFRESH_INTERVAL_MS)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void refreshMeeting()
    }
    const handleFocus = () => void refreshMeeting()

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      isMountedRef.current = false
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [refreshMeeting])

  useEffect(() => {
    const changed = (event: Event) => {
      if ((event as CustomEvent<{ code: string }>).detail.code === initialData.meeting.code) void refreshMeeting()
    }
    window.addEventListener(meetingProfileChanged, changed)
    return () => window.removeEventListener(meetingProfileChanged, changed)
  }, [initialData.meeting.code, refreshMeeting])

  useEffect(() => {
    const name = document.querySelector('[data-meeting-host-name]')
    if (name) name.textContent = meetingData.meeting.host.username
  }, [meetingData.meeting.host.username])

  return (
    <div className={styles.LiveView}>
      {meetingData.meeting.selectionType === 'ALL_DAY' && <TimezoneNotice zone={meetingData.meeting.timezone} dateOnly={!meetingData.meeting.confirmedTime || meetingData.meeting.confirmedTime === 'ALL_DAY'} />}
      <ResultContent
        meetingData={meetingData}
        onMeetingUpdated={refreshMeeting}
        commentShortcut={commentCount > 0 && (
          <a className={commentStyles.shortcut} href='#comments'>
            <span className={commentStyles.shortcutLabel}>
              <HiOutlineChatAlt2 size={16} aria-hidden='true' />
              <span>{t('comments.title')}</span>
            </span>
          </a>
        )}
        comments={<Comments code={meetingData.meeting.code} onSummary={onCommentSummary} />}
        actions={<ResultButtons data={meetingData} shareLabels={shareLabels} onMeetingUpdated={refreshMeeting} />}
      />
    </div>
  )
}

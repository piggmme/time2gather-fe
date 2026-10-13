import { useCallback, useEffect, useRef, useState } from 'react'
import { meetings, type get_meetings_$meetingCode_response } from '../../services/meetings'
import ResultButtons from './ResultButtons'
import ResultContent from './ResultContent'
import styles from './MeetingLiveView.module.scss'

type MeetingData = get_meetings_$meetingCode_response['data']

const REFRESH_INTERVAL_MS = 5000

export default function MeetingLiveView ({ initialData }: { initialData: MeetingData }) {
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

  return (
    <div className={styles.LiveView}>
      <div className={styles.Report}>
        <ResultContent meetingData={meetingData} />
      </div>
      <div className={styles.ButtonContainer}>
        <ResultButtons data={meetingData} onMeetingUpdated={refreshMeeting} />
      </div>
    </div>
  )
}

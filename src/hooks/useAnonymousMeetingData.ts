import { useEffect, useState } from 'react'
import { useStore } from '@nanostores/react'
import { meetings, type get_meetings_$meetingCode_response } from '../services/meetings'
import { $me } from '../stores/me'

type MeetingData = get_meetings_$meetingCode_response['data']
type Status = 'checking' | 'login' | 'loading' | 'ready' | 'error'

export function useAnonymousMeetingData (meetingCode: string) {
  const me = useStore($me)
  const [data, setData] = useState<MeetingData | null>(null)
  const [status, setStatus] = useState<Status>('checking')
  const [loadAttempt, setLoadAttempt] = useState(0)

  useEffect(() => {
    if (me === undefined) {
      setStatus('checking')
      return
    }

    const isCurrentAnonymous = me?.provider === 'ANONYMOUS' && me.anonymousMeetingCode === meetingCode
    if (!isCurrentAnonymous) {
      setData(null)
      setStatus('login')
      return
    }

    let cancelled = false
    setStatus('loading')

    meetings.$meetingCode.get(meetingCode)
      .then((response) => {
        if (cancelled) return
        setData(response.data)
        setStatus('ready')
      })
      .catch(() => {
        if (cancelled) return
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [loadAttempt, me, meetingCode])

  return {
    data,
    status,
    retry: () => setLoadAttempt(attempt => attempt + 1),
  }
}

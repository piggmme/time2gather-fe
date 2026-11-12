import { useStore } from '@nanostores/react'
import { useEffect, useRef, useState } from 'react'
import { $me } from '../stores/me'
import { meetingProfile, meetingProfileChanged } from '../services/meetingProfile'

export function useMeetingName (code: string) {
  const me = useStore($me)
  const [name, setValue] = useState('')
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const dirty = useRef(false)
  useEffect(() => {
    let active = true
    dirty.current = false
    setReady(false)
    setFailed(false)
    setValue(me?.username ?? '')
    if (!me) return
    const refresh = async () => {
      try {
        const profile = await meetingProfile.get(code)
        if (!active) return
        if (!dirty.current) setValue(profile.username)
        setReady(true)
        setFailed(false)
      } catch {
        if (active) setFailed(true)
      }
    }
    void refresh()
    const changed = (event: Event) => {
      if ((event as CustomEvent<{ code: string }>).detail.code === code) void refresh()
    }
    window.addEventListener(meetingProfileChanged, changed)
    return () => {
      active = false
      window.removeEventListener(meetingProfileChanged, changed)
    }
  }, [code, me?.userId, attempt])
  return {
    name,
    setName: (value: string) => {
      dirty.current = true
      setValue(value)
    },
    ready,
    failed,
    retry: () => setAttempt(value => value + 1),
    save: async () => {
      if (!ready || !name.trim() || $me.get()?.userId !== me?.userId) throw new Error('Meeting identity not ready')
      // An untouched form must not undo a name changed in another tab.
      const profile = await meetingProfile.put(code, name.trim(), !dirty.current)
      dirty.current = false
      setValue(profile.username)
    },
  }
}

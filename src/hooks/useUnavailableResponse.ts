import {
  useEffect, useRef, useState, type Dispatch, type SetStateAction,
} from 'react'

export function useUnavailableResponse<T> (status: string | undefined, value: T, setValue: Dispatch<SetStateAction<T>>, empty: () => T) {
  const [unavailable, setUnavailable] = useState((status === 'NONE' || status === 'NEEDS_RESPONSE'))
  const backup = useRef<T | null>(null)
  useEffect(() => {
    setUnavailable((status === 'NONE' || status === 'NEEDS_RESPONSE'))
  }, [status])
  const toggle = (checked: boolean) => {
    if (checked) {
      backup.current = value
      setValue(empty())
    } else {
      setValue(backup.current ?? empty())
      backup.current = null
    }
    setUnavailable(checked)
  }
  const select: Dispatch<SetStateAction<T>> = (next) => {
    setUnavailable(false)
    backup.current = null
    setValue(next)
  }
  return { unavailable, toggle, select }
}

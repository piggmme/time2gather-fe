import { useLayoutEffect, useRef, useState, type SetStateAction } from 'react'
import { readPageState, writePageState } from '../utils/navigationHistory'

// Entry-local UI state. No cookies, URLs, or long-lived local storage for drafts.
export function usePageState<T> (key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => readPageState(key, initialValue))
  const latest = useRef(value)
  latest.current = value
  const update = (next: SetStateAction<T>) => {
    const resolved = typeof next === 'function' ? (next as (previous: T) => T)(latest.current) : next
    latest.current = resolved
    writePageState(key, resolved)
    setValue(resolved)
  }
  return [value, update] as const
}

export function usePageScrollRestoration (ready = true) {
  useLayoutEffect(() => {
    if (!ready) return
    const position = readPageState<{ left: number, top: number } | null>('scroll', null)
    if (position) window.scrollTo({ ...position, behavior: 'instant' })
  }, [ready])
}

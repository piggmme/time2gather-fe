import { useEffect, useLayoutEffect, useRef } from 'react'
import { stepHistoryKey } from '../utils/navigationHistory'
import { navigate } from '../utils/navigation'

// Keep each step's viewport in component memory; no personal data is persisted.
export function useStepScrollRestoration<T extends string> (step: T, setStep: (step: T) => void) {
  const positions = useRef(new Map<T, { left: number, top: number }>())
  const pending = useRef(false)
  const firstStep = useRef(step)

  useEffect(() => {
    const page = window.location.pathname + window.location.search
    if (!window.history.state?.[stepHistoryKey] && window.location.hash.startsWith('#vote-')) {
      // A copied step URL has no in-progress ballot. Start at the first step.
      window.history.replaceState(window.history.state, '', page)
    }
    const restore = () => {
      if (window.location.pathname + window.location.search !== page) return
      const entry = window.history.state?.[stepHistoryKey]
      pending.current = true
      setStep(entry?.page === page ? entry.value : firstStep.current)
    }
    restore()
    window.addEventListener('popstate', restore)
    return () => window.removeEventListener('popstate', restore)
  }, [setStep])

  useLayoutEffect(() => {
    if (!pending.current) return
    pending.current = false
    window.scrollTo({ ...(positions.current.get(step) ?? { left: 0, top: 0 }), behavior: 'instant' })
  }, [step])

  return async (nextStep: T) => {
    if (nextStep === step) return
    positions.current.set(step, { left: window.scrollX, top: window.scrollY })
    const entry = window.history.state?.[stepHistoryKey]
    if (entry?.previous === nextStep) {
      return new Promise<void>((resolve) => {
        window.addEventListener('popstate', () => resolve(), { once: true })
        window.history.back()
      })
    }
    // Same-document history lets browser Back close the location step first,
    // while React keeps schedule and location inputs mounted.
    await navigate(`#vote-${nextStep}`, {
      state: {
        ...window.history.state,
        [stepHistoryKey]: { page: window.location.pathname + window.location.search, value: nextStep, previous: step, depth: (entry?.depth ?? 0) + 1 },
      },
    })
    pending.current = true
    setStep(nextStep)
  }
}

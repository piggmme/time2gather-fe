import { useRef } from 'react'

// Controlled dialogs may have no Radix Trigger. Remember the opener without
// letting focus restoration scroll the page or the calendar's inner container.
export function useDialogReturnFocus () {
  const opener = useRef<HTMLElement | null>(null)
  return {
    onOpenAutoFocus: () => {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    },
    onCloseAutoFocus: (event: Event) => {
      if (!opener.current?.isConnected) return
      event.preventDefault()
      opener.current.focus({ preventScroll: true })
    },
  }
}

import { useEffect, useRef, useState, type ReactNode } from 'react'
import styles from './CreateFlowActions.module.scss'

export default function CreateFlowActions ({ children }: { children: ReactNode }) {
  const bar = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState({ height: 81, width: 0, inlineStart: 0, bottom: 0 })

  useEffect(() => {
    const element = bar.current
    const main = element?.closest('main')
    if (!element || !main) return
    const viewport = window.visualViewport
    let frame = 0
    const update = () => {
      frame = 0
      const mainBounds = main.getBoundingClientRect()
      const barBounds = element.getBoundingClientRect()
      const visibleBottom = viewport?.scale === 1 ? viewport.height + viewport.offsetTop : window.innerHeight
      const next = {
        height: barBounds.height,
        width: mainBounds.width,
        inlineStart: document.documentElement.dir === 'rtl' ? barBounds.right - mainBounds.right : mainBounds.left - barBounds.left,
        bottom: Math.max(0, window.innerHeight - visibleBottom),
      }
      setLayout(previous => Object.keys(next).every(key => previous[key as keyof typeof next] === next[key as keyof typeof next]) ? previous : next)
      main.style.setProperty('--create-actions-height', `${next.height}px`)

      const focused = document.activeElement
      if (focused instanceof HTMLInputElement && main.contains(focused)) {
        const bounds = focused.getBoundingClientRect()
        const limit = visibleBottom - next.height - 24
        if (bounds.bottom > limit) window.scrollBy({ top: bounds.bottom - limit, behavior: 'instant' })
      }
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    const observer = new ResizeObserver(schedule)
    observer.observe(element)
    observer.observe(main)
    window.addEventListener('resize', schedule)
    viewport?.addEventListener('resize', schedule)
    viewport?.addEventListener('scroll', schedule)
    main.addEventListener('focusin', schedule)
    schedule()
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', schedule)
      viewport?.removeEventListener('resize', schedule)
      viewport?.removeEventListener('scroll', schedule)
      main.removeEventListener('focusin', schedule)
      main.style.removeProperty('--create-actions-height')
    }
  }, [])

  return (
    <>
      <div className={styles.spacer} style={{ height: layout.height + 32 }} aria-hidden='true' />
      <div className={styles.bar} ref={bar} style={{ bottom: layout.bottom }} data-create-flow-actions>
        <div className={styles.buttons} style={layout.width ? { width: layout.width, marginInlineStart: layout.inlineStart } : undefined}>
          {children}
        </div>
      </div>
    </>
  )
}

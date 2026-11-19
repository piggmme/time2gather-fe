import {
  useEffect, useEffectEvent, useRef, useState, type MouseEvent, type RefObject, type TouchEvent as ReactTouchEvent,
} from 'react'
import type dayjs from 'dayjs'

type Direction = 'left' | 'right'

export type SwipeMonth = { date: dayjs.Dayjs, days: dayjs.Dayjs[] }
export type SwipeMonths = Partial<Record<Direction, SwipeMonth>> & {
  select: (date: dayjs.Dayjs) => void
}

export function useMonthSwipe (container: RefObject<HTMLDivElement | null>, months?: SwipeMonths) {
  const track = useRef<HTMLDivElement>(null)
  const contact = useRef<{ x: number, y: number, axis?: 'horizontal' | 'vertical' } | null>(null)
  const offset = useRef(0)
  const animation = useRef<Animation | null>(null)
  const suppressClick = useRef(false)
  const [direction, setDirection] = useState<Direction>()
  const preview = direction ? months?.[direction] : undefined
  const swipeEnabled = Boolean(months)

  useEffect(() => () => animation.current?.cancel(), [])

  const translate = (x: number) => {
    offset.current = x
    track.current?.style.setProperty('--month-offset', `${x}px`)
  }

  const settle = (next?: SwipeMonth, side?: Direction) => {
    const element = track.current
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches || (!next && !offset.current)) {
      translate(0)
      setDirection(undefined)
      if (next) months?.select(next.date)
      return
    }

    const width = element.parentElement?.clientWidth ?? element.clientWidth
    const destination = next ? width * (side === 'left' ? -1 : 1) : 0
    const slide = element.animate(
      [{ transform: `translateX(${offset.current}px)` }, { transform: `translateX(${destination}px)` }],
      { duration: next ? 240 : 180, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' },
    )
    animation.current = slide
    void slide.finished.then(() => {
      if (animation.current !== slide) return
      if (next) {
        months?.select(next.date)
        return
      }
      translate(0)
      setDirection(undefined)
      animation.current = null
      slide.cancel()
    }, () => {})
  }

  const cancelGesture = () => {
    contact.current = null
    if (!animation.current && offset.current) settle()
  }

  const trackMovement = (dx: number) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const side = dx < 0 ? 'left' : 'right'
    const width = track.current?.parentElement?.clientWidth ?? 0
    const hasNeighbor = Boolean(months?.[side])
    const distance = hasNeighbor ? Math.min(Math.abs(dx), width) : Math.min(Math.abs(dx) * 0.22, 24)
    setDirection(hasNeighbor ? side : undefined)
    translate(distance * Math.sign(dx))
  }

  const onTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (animation.current || event.touches.length !== 1) {
      cancelGesture()
      return
    }
    const touch = event.touches[0]
    contact.current = { x: touch.clientX, y: touch.clientY }
  }

  const onTouchMove = useEffectEvent((event: TouchEvent) => {
    if (event.touches.length !== 1) {
      cancelGesture()
      return
    }
    const start = contact.current
    if (!start || start.axis === 'vertical') return
    const touch = event.touches[0]
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    if (!start.axis && Math.max(Math.abs(dx), Math.abs(dy)) >= 12) {
      start.axis = Math.abs(dx) > Math.abs(dy) * 1.25 ? 'horizontal' : 'vertical'
    }
    if (start.axis !== 'horizontal') return
    if (event.cancelable) event.preventDefault()
    trackMovement(dx)
  })

  useEffect(() => {
    const element = container.current
    if (!element || !swipeEnabled) return
    // React's touchmove listener is passive. Use a native listener before the browser starts scrolling.
    const move = (event: TouchEvent) => onTouchMove(event)
    element.addEventListener('touchmove', move, { capture: true, passive: false })
    return () => element.removeEventListener('touchmove', move, true)
  }, [container, swipeEnabled])

  const onTouchEnd = (event: ReactTouchEvent<HTMLDivElement>) => {
    const start = contact.current
    contact.current = null
    if (!start || event.touches.length) return
    suppressClick.current = Boolean(start.axis)
    if (start.axis !== 'horizontal') return

    const touch = event.changedTouches[0]
    const dx = touch.clientX - start.x
    const side = dx < 0 ? 'left' : 'right'
    const next = Math.abs(dx) >= 44 ? months?.[side] : undefined
    if (next) trackMovement(dx)
    settle(next, side)
  }

  return {
    track,
    direction,
    preview,
    cancelGesture,
    handlers: months
      ? {
          onTouchStartCapture: onTouchStart,
          onTouchEndCapture: onTouchEnd,
          onTouchCancelCapture: cancelGesture,
          onPointerDownCapture: () => { suppressClick.current = false },
          onClickCapture: (event: MouseEvent<HTMLDivElement>) => {
            if (event.detail === 0 || (!suppressClick.current && !animation.current)) return
            suppressClick.current = false
            event.stopPropagation()
          },
        }
      : undefined,
  }
}

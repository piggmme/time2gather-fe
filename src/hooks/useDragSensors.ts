import {
  MouseSensor, PointerSensor, TouchSensor, useSensor, useSensors,
} from '@dnd-kit/core'

export function useDragSensors (allowTouchSwipe = false) {
  // Leave touch input to the long-press sensor on swipeable calendars.
  return useSensors(
    useSensor(allowTouchSwipe ? MouseSensor : PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  )
}

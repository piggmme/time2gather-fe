import { atom } from 'nanostores'

type BaseToast = {
  duration?: number
  message: string
  id: string
  permanent?: boolean
}

type DefaultToast = {
  type: 'default'
} & BaseToast

type CautionToast = {
  type: 'caution'
} & BaseToast

type Toast = DefaultToast | CautionToast

const $toastTimerIds = atom<Record<string, NodeJS.Timeout>>({})
export const $toasts = atom<Toast[]>([])

const MAX_SIZE = 10
const DELAY = 7000

export function showDefaultToast (toast: Pick<DefaultToast, 'message' | 'duration' | 'permanent'>) {
  return showToast({
    type: 'default',
    ...toast,
  })
}

export function showCautionToast (toast: Pick<CautionToast, 'message' | 'duration' | 'permanent'>) {
  return showToast({
    type: 'caution',
    ...toast,
  })
}

export function showToast (toast: Omit<Toast, 'id'>) {
  const id = String(Date.now()) + toast.message
  $toasts.set([...$toasts.get().filter(({ message }) => message !== toast.message), {
    id,
    ...toast,
  }])

  if (!toast.permanent) {
    const timerId = setTimeout(() => {
      closeToast(id)
    }, toast.duration || DELAY)
    $toastTimerIds.set({ ...$toastTimerIds.get(), [id]: timerId })
  }

  if ($toasts.get().length > MAX_SIZE) {
    closeToast($toasts.get()[0].id)
  }

  return id
}

export function closeToast (id: string) {
  $toasts.set(
    $toasts.get().filter(toast => toast.id !== id),
  )
  removeTimerId(id)
}

export function closeToastByMessage (message: string) {
  const toast = $toasts.get().find(toast => toast.message === message)
  if (!toast) return
  $toasts.set(
    $toasts.get().filter(({ id }) => toast.id !== id),
  )
  removeTimerId(toast.id)
}

function removeTimerId (id: string) {
  const timerId = $toastTimerIds.get()[id]
  if (timerId) {
    clearTimeout(timerId)
    const newTimerIds = { ...$toastTimerIds.get() }
    delete newTimerIds[id]
    $toastTimerIds.set(newTimerIds)
  }
}

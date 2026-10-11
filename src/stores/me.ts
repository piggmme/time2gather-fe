import { atom, onMount, task } from 'nanostores'
import { auth, type Meeting } from '../services/auth'

export type User = {
  userId: number
  username: string
  email?: string | null
  profileImageUrl?: string | null
  createdAt?: string
  createdMeetings?: Meeting[]
  participatedMeetings?: Meeting[]
  provider: 'ANONYMOUS'
  role: 'USER' | 'ADMIN'
}

export const $me = atom<User | null | undefined>(undefined)

export const refreshMe = async () => {
  try {
    const response = await auth.me.get()
    $me.set(response.data || null)
  } catch {
    $me.set(null)
  }
}

onMount($me, () => {
  task(refreshMe)
})

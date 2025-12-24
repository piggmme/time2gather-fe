import { atom, onMount, task } from 'nanostores'
import { auth, type Meeting } from '../services/auth'

type BasicUser = {
  userId: number
  username: string
  email: string
  profileImageUrl: string
  createdAt?: string
  createdMeetings?: Meeting[]
  participatedMeetings?: Meeting[]
}

type NormalUser = BasicUser & {
  provider: 'kakao' | 'google'
}

type AnonymousUser = BasicUser & {
  provider: 'ANONYMOUS'
  anonymousMeetingCode: string
}

export type User = NormalUser | AnonymousUser

export const $me = atom<User | null | undefined>(undefined)

const fetchMe = async () => {
  console.log('fetchMe')
  try {
    const response = await auth.me.get()
    $me.set(response.data || null)
  } catch (error) {
    $me.set(null)
  }
}

const resetAnonymousUser = async (event: any) => {
  const isMeetingLink = event.to.pathname.startsWith('/meetings/')
  if ($me.get()?.provider !== 'ANONYMOUS') return
  if (!isMeetingLink) return

  const response = await auth.me.get()
  $me.set(response.data || response)
}

onMount($me, () => {
  task(fetchMe)

  document.addEventListener('astro:before-swap', resetAnonymousUser)

  return () => {
    document.removeEventListener('astro:before-swap', resetAnonymousUser)
  }
})

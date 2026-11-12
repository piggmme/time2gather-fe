import { getLocaleFromContext } from '../i18n'
import axios from 'axios'
import type { success_response } from './type'
import { getAdminCredential, setAdminCredential } from './adminCredential'

export { getAdminCredential, setAdminCredential } from './adminCredential'

// Cold starts observed in production take 22–28s; bootstrap auth must outlast them.
const AUTH_TIMEOUT_MS = 60_000

// Dedicated client: admin failures never clear the anonymous meeting session.
const api = axios.create({ baseURL: import.meta.env.PUBLIC_API_URL || '/api', withCredentials: false, timeout: 15000 })
api.interceptors.request.use((config) => {
  config.headers.set('Accept-Language', getLocaleFromContext())
  return config
})
api.interceptors.request.use((config) => {
  const credential = getAdminCredential()
  if (credential && !config.headers.has('Authorization')) config.headers.set('Authorization', `Bearer ${credential}`)
  return config
})
api.interceptors.response.use(response => response, (error) => {
  if (error.response?.status === 401 || error.response?.status === 403) {
    setAdminCredential(null)
    window.dispatchEvent(new Event('admin-session-expired'))
  }
  return Promise.reject(error)
})

export type AdminSummary = {
  users: {
    total: number
    registered: number
    anonymous: number
    admins: number
  }
  meetings: {
    total: number
    active: number
    confirmed: number
  }
}

export type AdminUser = {
  id: number
  username: string
  email: string | null
  participatedMeetings: AdminParticipatedMeeting[]
  provider: 'ANONYMOUS' | 'KAKAO' | 'GOOGLE'
  role: 'USER' | 'ADMIN'
  createdAt: string | null
}

export type AdminParticipatedMeeting = Pick<AdminMeeting, 'id' | 'meetingCode' | 'title' | 'active' | 'confirmed'>

export type AdminMeeting = {
  id: number
  meetingCode: string
  title: string
  hostUserId: number
  hostUsername: string | null
  selectionType: 'TIME' | 'ALL_DAY'
  active: boolean
  confirmed: boolean
  createdAt: string | null
}

export type AdminPage<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  nextCursor?: string | null
}

export type AdminUsageStats = {
  generatedAt: string
  basis: 'CURRENT_STORED_STATE_ALL_TIME'
  activationResponseThreshold: number
  totalMeetings: number
  activeMeetings: number
  respondedMeetings: number
  activatedMeetings: number
  confirmedMeetings: number
  externalResponses: number
  hosts: number
  repeatHosts: number
  activationRate: number
  confirmationRate: number
  repeatHostRate: number
}

const getUsage = async (excludeHostUserIds: number[] = []) => {
  const response = await api.get<success_response<AdminUsageStats>>('v1/admin/usage', {
    timeout: AUTH_TIMEOUT_MS,
    params: { excludeHostUserIds: excludeHostUserIds.length ? excludeHostUserIds.join(',') : undefined },
  })
  return response.data.data
}

const getSummary = async () => {
  const response = await api.get<success_response<AdminSummary>>('v1/admin/summary')
  return response.data.data
}

const getUsers = async (query: string, page: number, size = 20, cursor?: string) => {
  const response = await api.get<success_response<AdminPage<AdminUser>>>('v1/admin/users', {
    params: { query, page, size, cursor },
  })
  return response.data.data
}

const getMeetings = async (query: string, page: number, size = 20, cursor?: string, confirmedOnly = false) => {
  const response = await api.get<success_response<AdminPage<AdminMeeting>>>('v1/admin/meetings', {
    params: {
      query, page, size, cursor, confirmedOnly,
    },
  })
  return response.data.data
}

export const admin = {
  summary: { get: getSummary },
  usage: { get: getUsage },
  users: { get: getUsers },
  meetings: { get: getMeetings },
}

export type AdminSession = { subject: string, email: string, expiresAt: string }
export const getAdminConfig = async () => (await api.get<success_response<{ enabled: boolean, clientId: string }>>('v1/admin/auth/config', { timeout: AUTH_TIMEOUT_MS })).data.data
export const createAdminSession = async (googleCredential: string) => {
  const response = await api.post<success_response<{ credential: string, identity: AdminSession }>>('v1/admin/auth/session', null, {
    timeout: AUTH_TIMEOUT_MS,
    headers: { Authorization: `Bearer ${googleCredential}` },
  })
  setAdminCredential(response.data.data.credential)
  return response.data.data.identity
}
export const getAdminSession = async () => {
  const saved = getAdminCredential()
  // Upgrade a still-valid Google token saved by the previous frontend.
  if (saved && !saved.startsWith('t2ga.')) return createAdminSession(saved)
  return (await api.get<success_response<AdminSession>>('v1/admin/auth/session', { timeout: AUTH_TIMEOUT_MS })).data.data
}

import api from '../utils/api'
import type { success_response } from './type'

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
  provider: 'ANONYMOUS' | 'KAKAO' | 'GOOGLE'
  role: 'USER' | 'ADMIN'
  createdAt: string | null
}

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
}

const getSummary = async () => {
  const response = await api.get<success_response<AdminSummary>>('v1/admin/summary')
  return response.data.data
}

const getUsers = async (query: string, page: number, size = 20) => {
  const response = await api.get<success_response<AdminPage<AdminUser>>>('v1/admin/users', {
    params: { query, page, size },
  })
  return response.data.data
}

const getMeetings = async (query: string, page: number, size = 20) => {
  const response = await api.get<success_response<AdminPage<AdminMeeting>>>('v1/admin/meetings', {
    params: { query, page, size },
  })
  return response.data.data
}

export const admin = {
  summary: { get: getSummary },
  users: { get: getUsers },
  meetings: { get: getMeetings },
}

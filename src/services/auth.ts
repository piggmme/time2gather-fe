import type { User } from '../stores/me'
import api from '../utils/api'
import type { success_response } from './type'

export type Meeting = {
  code: string
  createdAt: string
  description?: string
  id: number
  timezone: string
  title: string
}

type post_auth_anonymous_response = success_response<{
  userId: number
  username: string
  isNewUser: boolean
}>

const post_auth_anonymous = async (username: string) => {
  const response = await api.post<post_auth_anonymous_response>('/v1/auth/anonymous', { username })
  return response.data
}

type get_auth_me_response = success_response<User>
const get_auth_me = async () => {
  const response = await api.get<get_auth_me_response>('/v1/auth/me')
  return response.data
}

const put_auth_me = async (username: string) => {
  const response = await api.put<post_auth_anonymous_response>('/v1/auth/me', { username })
  return response.data
}

export const auth = {
  anonymous: { post: post_auth_anonymous },
  me: { get: get_auth_me, put: put_auth_me },
}

import api from '../utils/api'
import type { success_response, error_response } from './type'

type post_auth_oauth_$provider_body = {
  authorizationCode: string
  redirectUrl?: string
}
type post_auth_oauth_$provider_response = success_response<{
  userId: number
  username: string
  email: string
  profileImageUrl: string
  provider: 'kakao' | 'google'
  isNewUser: boolean
}>
const post_auth_oauth_$provider = async (provider: 'kakao' | 'google', body: post_auth_oauth_$provider_body) => {
  const response = await api.post<post_auth_oauth_$provider_response>(
    `v1/auth/oauth/${provider}`,
    body,
  )
  return response.data
}

export type Meeting = {
  code: string
  createdAt: string
  description?: string
  id: number
  timezone: string
  title: string
}
type get_auth_me_response = success_response<{
  userId: number
  username: string
  email: string
  profileImageUrl: string
  provider: 'kakao' | 'google'
  createdAt: string
  createdMeetings?: Meeting[]
  participatedMeetings?: Meeting[]
}>
const get_auth_me = async () => {
  const response = await api.get<get_auth_me_response>('v1/auth/me')
  return response.data
}

export const auth = {
  oauth: {
    $provider: {
      post: post_auth_oauth_$provider,
    },
  },
  me: {
    get: get_auth_me,
  },
}

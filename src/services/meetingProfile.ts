import api from '../utils/api'
import type { success_response } from './type'

export const meetingProfileChanged = 'time2gather:meeting-profile-changed'
export const meetingProfile = {
  get: async (code: string) => (await api.get<success_response<{ username: string }>>(`/v1/meetings/${encodeURIComponent(code)}/profile`, { suppressErrorToast: true })).data.data,
  put: async (code: string, username: string, onlyIfAbsent = false) => {
    const data = (await api.put<success_response<{ username: string }>>(`/v1/meetings/${encodeURIComponent(code)}/profile`, { username, onlyIfAbsent })).data.data
    window.dispatchEvent(new CustomEvent(meetingProfileChanged, { detail: { code } }))
    return data
  },
}

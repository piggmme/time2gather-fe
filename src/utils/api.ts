import axios, { type AxiosError } from 'axios'
import { $me } from '../stores/me'
import { showCautionToast } from '../stores/toast'
import type { error_response } from '../services/type'
import { getLocaleFromContext, getTranslations } from '../i18n'

const api = axios.create({
  withCredentials: true,
  baseURL: import.meta.env.PUBLIC_API_URL || 'https://api.time2gather.org/api',
})

const shouldResetSession = (error: AxiosError<error_response>) => {
  return error.response?.status === 401 || error.response?.data?.message === 'OAuth login failed: JWT 인증 정보가 아닙니다.'
}

api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (shouldResetSession(error)) {
      $me.set(null)
    } else if (!error.config?.url?.includes('/auth/oauth/')) {
      const t = getTranslations(getLocaleFromContext())
      showCautionToast({
        message: error.response?.data?.message || error.response?.data?.error || t('common.error'),
      })
    }
    return Promise.reject(error)
  },
)

export default api

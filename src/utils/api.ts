import axios, { type AxiosError } from 'axios'
import { $me } from '../stores/me'
import { showCautionToast } from '../stores/toast'
import type { error_response } from '../services/type'
import { getLocaleFromContext, getTranslations } from '../i18n'

declare module 'axios' {
  interface AxiosRequestConfig {
    suppressErrorToast?: boolean
  }

  interface InternalAxiosRequestConfig {
    suppressErrorToast?: boolean
  }
}

const apiBaseUrl = import.meta.env.SSR
  ? import.meta.env.API_URL
  || import.meta.env.PUBLIC_API_URL
  || (import.meta.env.DEV ? 'http://localhost:8080/api' : 'https://time2gather.org/api')
  : import.meta.env.PUBLIC_API_URL || '/api'

const api = axios.create({
  withCredentials: true,
  baseURL: apiBaseUrl,
})

api.interceptors.request.use((config) => {
  config.headers.set('Accept-Language', getLocaleFromContext())
  return config
})

const shouldResetSession = (error: AxiosError<error_response>) => {
  return error.response?.status === 401
}

api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (shouldResetSession(error)) {
      $me.set(null)
    } else if (!error.config?.suppressErrorToast) {
      const t = getTranslations(getLocaleFromContext())
      showCautionToast({
        message: error.response?.data?.message || error.response?.data?.error || t('common.error'),
      })
    }
    return Promise.reject(error)
  },
)

export default api

import axios, { AxiosError } from 'axios'
import { $me } from '../stores/me'
import { showCautionToast } from '../stores/toast'
import type { error_response } from '../services/type'

const api = axios.create({
  withCredentials: true,
  baseURL: "https://api.time2gather.org/api",
})

const checkIsAuthError = (error: AxiosError<error_response>) => {
  return error.response?.status === 401 || error.response?.status === 403 || error.response?.data?.message === "OAuth login failed: JWT 인증 정보가 아닙니다."
}

api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (checkIsAuthError(error)) {
      $me.set(null)
    } else{
      showCautionToast({
        message: error.response.data.message || error.response.data.error || '문제가 발생했습니다. 잠시후 다시 시도해주세요.',
      })
    }
    return Promise.reject(error)
  },
)

export default api
import axios from 'axios'
import { $me } from '../stores/me'
import { showCautionToast } from '../stores/toast'

const api = axios.create({
  withCredentials: true,
  baseURL: "https://api.time2gather.org/api",
})

api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response.status === 401) {
      $me.set(null)
    }
    showCautionToast({
      message: error.response.data.message || error.response.data.error || '문제가 발생했습니다. 잠시후 다시 시도해주세요.',
    })
    return Promise.reject(error)
  },
)

export default api
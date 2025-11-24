import axios from 'axios'
import { $me } from '../stores/me'

const api = axios.create({
  withCredentials: true,
  baseURL: "https://api.time2gather.org/api",
})

api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response.status === 401) {
      $me.set(null)
    }
    return Promise.reject(error)
  },
)

export default api
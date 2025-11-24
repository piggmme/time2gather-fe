import axios from 'axios'

const api = axios.create({
  withCredentials: true,
  baseURL: "http://api.time2gather.org",
})

api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    return Promise.reject(error)
  },
)

export default api
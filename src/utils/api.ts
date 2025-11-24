import axios from 'axios'

const api = axios.create({
  withCredentials: true,
  baseURL: "https://api.time2gather.org/api",
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
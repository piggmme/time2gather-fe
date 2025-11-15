import axios from 'axios'

const api = axios.create({
  withCredentials: true,
  baseURL: import.meta.env.DEV ? undefined : import.meta.env.PUBLIC_API_URL,
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
import axios from "axios"

export const axiosInstance = axios.create({
  validateStatus: () => true
})

// todo: refresh token if required
axiosInstance.interceptors.request.use(function (config) {
  return config
}, function (error) {
  return Promise.reject(error)
})

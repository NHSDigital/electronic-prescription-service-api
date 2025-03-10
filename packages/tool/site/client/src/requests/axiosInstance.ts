import axios, {InternalAxiosRequestConfig} from "axios"
import {v4 as uuidv4} from "uuid"

const axiosInstance = axios.create({
  validateStatus: () => true
})

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.headers["x-correlation-id"] = uuidv4()
    return config
  },
  (error) => {
    return Promise.reject(Error(error))
  }
)

export {axiosInstance}

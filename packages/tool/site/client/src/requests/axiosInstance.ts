import axios, {InternalAxiosRequestConfig} from "axios"

const axiosInstance = axios.create({
  validateStatus: () => true
})

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.headers["x-correlation-id"] = crypto.randomUUID()
    return config
  },
  (error) => {
    return Promise.reject(Error(error))
  }
)

export {axiosInstance}

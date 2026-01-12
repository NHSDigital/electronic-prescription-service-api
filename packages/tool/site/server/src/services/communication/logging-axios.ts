import pino from "pino"
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig
} from "axios"

export default class LoggingAxios {
  private readonly axiosInstance: AxiosInstance

  constructor(logger: pino.Logger) {
    this.axiosInstance = axios.create()

    this.axiosInstance.interceptors.request.use((request: InternalAxiosRequestConfig) => {
      logger.info({
        apiCall: {
          request: {
            headers: request.headers,
            url: request.url,
            baseURL: request.baseURL,
            method: request.method,
            data: request.data
          }}
      }, "making api call")

      return request
    })

    this.axiosInstance.interceptors.response.use((response: AxiosResponse) => {
      logger.info({
        apiCall: {
          response: {
            headers: response.headers,
            status: response.status,
            statusText: response.statusText,
            data: response.data
          }
        }
      }, "successful api call")

      return response
    }, (error: AxiosError) => {
      logger.error({
        response: {
          headers: error.response?.headers,
          status: error.response?.status,
          error: error.toJSON()
        }}, "unsuccessful api call")

      // let epsat figure out how to deal with errors so just return response
      return error.response
    })
  }

  getInstance(): AxiosInstance {
    return this.axiosInstance
  }
}

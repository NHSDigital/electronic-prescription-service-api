import axios from "axios"
import instance from "./api"

const url = process.env["PACT_PROVIDER_URL"]

export function Req() {
  async function get(path) {
    return await instance.get(path)
  }

  async function post(path, data) {
    return await instance.post(url + path, data)
  }

  async function adhocGet(url, config) {
    return await axios.get(url, config)
    //return axios({method: 'get', url:url, headers: config})
  }
  async function adhocPost(url, data, config) {
    //return await axios.post(url, data, config) //getting 400 bad request with this
    return axios({method: "post", url: url, data: data, headers: config})
  }

  async function adhocPost1(url, data, config) {
    //return await axios.post(url, data, config) //getting 400 bad request with this
    return axios({method: "post", url: url, data: data, headers: config})
  }

  return {
    get,
    post,
    adhocGet,
    adhocPost,
    adhocPost1
  }
}
//module.exports = Req;

import axios from "axios"
import fs from "fs"
import * as genid from "../../util/genId"

const url = process.env["PACT_PROVIDER_URL"]
const dir = "./resources"

const instance = axios.create({
  baseURL: url,
  headers: {
    "NHSD-Session-URID": "555254242106",
    "X-Request-ID": genid.generateRandomUUID(),
    "X-Correlation-ID": genid.generateRandomUUID(),
    "Content-Type": "application/json",
    Accept: "application/json"
  }
})

//instance.defaults.headers.post['Content-Type'] = "application/fhir+json"

instance.interceptors.request.use((request) => {
  writeToFile(JSON.stringify(request.data), "json", "Req_")
  return request
})

instance.interceptors.response.use(
  (response) => {
    writeToFile(JSON.stringify(response.data), "json", "Resp_")
    return response
  },
  (error) => {
    writeToFile(JSON.stringify(error.response.data), "json", "Resp_")
    return Promise.reject(error)
  }
)

export default instance

function writeToFile(text, extension, prefix) {
  let user = process.env.GITHUB_USER
  if (user === undefined) {
    user = process.env.USER
  }

  const folderName = dir + "/" + user + "/"
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }
    if (!fs.existsSync(folderName)) {
      fs.mkdirSync(folderName)
    }
  } catch (e) {
    console.log(e)
  }
  const filename = folderName + prefix + new Date().toISOString() + "." + extension
  fs.writeFileSync(filename, text)
}

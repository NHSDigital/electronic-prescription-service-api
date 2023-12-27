import axios from "axios"
import fs from "fs"
import path from "path"

const url = process.env["PACT_PROVIDER_URL"]
const dir = "./resources"

const instance = axios.create({
  baseURL: url,
  headers: {
    "NHSD-Session-URID": "555254242106",
    "X-Request-ID": crypto.randomUUID(),
    "X-Correlation-ID": crypto.randomUUID(),
    "Content-Type": "application/json",
    Accept: "application/json"
  }
})

//instance.defaults.headers.post['Content-Type'] = "application/fhir+json"

instance.interceptors.request.use((request) => {
  const x_request_id = crypto.randomUUID()
  request.headers["X-Request-ID"] = x_request_id
  writeToFile(JSON.stringify(request.data), "json", "Req_", x_request_id)
  return request
})

instance.interceptors.response.use(
  (response) => {
    const x_request_id = response.headers["x-request-id"]
    writeToFile(JSON.stringify(response.data), "json", "Resp_", x_request_id)
    return response
  },
  (error) => {
    const x_request_id = error.response.headers["x-request-id"]
    writeToFile(JSON.stringify(error.response.data), "json", "Resp_", x_request_id)
    writeToFile(JSON.stringify(error.response.headers), "json", "Resp_headers_", x_request_id)
    return Promise.reject(error)
  }
)

export default instance

function writeToFile(text, extension, prefix, subfolder) {
  let user = process.env.GITHUB_USER
  if (user === undefined) {
    user = process.env.USER
  }

  const folderName = path.join(dir, user, subfolder)
  try {
    fs.mkdirSync(folderName, {recursive: true})
  } catch (e) {
    console.log(e)
  }
  const filename = path.join(folderName, `${prefix}${ new Date().toISOString()}.${extension}`)
  fs.writeFileSync(filename, text)
}

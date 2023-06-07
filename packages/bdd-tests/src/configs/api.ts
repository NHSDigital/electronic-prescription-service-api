import axios from "axios"
import fs from "fs"
import * as genid from "../../util/genId"

const url = process.env["PACT_PROVIDER_URL"]
const dir = "./resources"

const instance = axios.create({
  baseURL: url,
  headers: {
    "NHSD-Session-URID": process.env.NHSD_Session_URID,
    "X-Request-ID": genid.generateRandomUUID(),
    "X-Correlation-ID": genid.generateRandomUUID(),
    "Content-Type": "application/json",
    Accept: "application/json"
  }
})

//instance.defaults.headers.post['Content-Type'] = "application/fhir+json"

instance.interceptors.request.use((request) => {
  //console.log('Starting Request 4444 ..............................', JSON.stringify(request, null, 2))
  writeToFile(JSON.stringify(request.data), "json", "Req_")
  return request
})

instance.interceptors.response.use(
  (response) => {
    //console.log('RESPONSE 4444 ..............................', JSON.stringify(response.data))
    writeToFile(JSON.stringify(response.data), "json", "Resp_")
    return response
  },
  (error) => {
    console.error(`==========================+++++++++++++++++ ${error}`)
    console.error(`Status code ${error.response.status} : Message - ${error.response.statusText}`)
    console.error(error.response.data)
    if (Object.prototype.hasOwnProperty.call(error.response.data.hasOwnProperty, "issue")) {
      if (Object.prototype.hasOwnProperty.call(error.response.data.issue[0], "details")) {
        console.error(JSON.stringify(error.response.data.issue[0].details))
      } else if (Object.prototype.hasOwnProperty.call(error.response.data.issue[0], "diagnostics")) {
        console.error(JSON.stringify(error.response.data.issue[0].diagnostics))
      }
    }
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

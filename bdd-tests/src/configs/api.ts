import axios from "axios";
import fs from "fs";
const genid = require("../../util/genId");

let url = process.env.base_url;

let instance = axios.create({
  baseURL: url,
  headers: {
    "NHSD-Session-URID": "555254242106",
    "X-Request-ID": genid.generateRandomUUID(),
    "X-Correlation-ID": "11C46F5F-CDEF-4865-94B2-0EE0EDCC26DA",
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
});

//instance.defaults.headers.post['Content-Type'] = "application/fhir+json"

instance.interceptors.request.use(request => {
  //console.log('Starting Request 4444 ..............................', JSON.stringify(request, null, 2))
  writeToFile(JSON.stringify(request.data), "json", "Req_")
  return request;
})

instance.interceptors.response.use(response => {
  //console.log('RESPONSE 4444 ..............................', JSON.stringify(response.data))
  writeToFile(JSON.stringify(response.data), "json", "Resp_")
  return response;
}, error => {
  //console.error(`==========================+++++++++++++++++ ${error}`)
  console.error(`Status code ${error.response.status} : Message - ${error.response.statusText}`)
  console.error(error.response.data)
  console.error(JSON.stringify(error.response.data.issue[0].details))
  return Promise.reject(error);
});
export default instance;

function writeToFile(text, extension, prefix) {
  let user = process.env.GITHUB_USER;
  if (user == undefined) {
    user = process.env.USER;
  }
  try {
    fs.mkdirSync("./resources/" + user);
  } catch (e) { }
  let filename = "./resources/" + user + "/" + prefix + new Date().toISOString() + "." + extension
  fs.writeFileSync(filename, text);
}





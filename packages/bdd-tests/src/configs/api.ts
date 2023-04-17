import axios from "axios"
import fs from "fs"
import * as genid from "../../util/genId"
import * as dotenv from 'dotenv';
import * as path from 'path';

//use .env.dev or .env.qa depending on NODE_ENV variable
export const envPath = path.resolve(
  __dirname,
  process.env.NODE_ENV === 'qa' ? '../../.env.qa' : '../../.env.dev',
);
dotenv.config({ path: envPath });

let url = process.env.base_url;
let dir = './resources';

let instance = axios.create({
  baseURL: url,
  headers: {
    "NHSD-Session-URID": process.env.NHSD_Session_URID,
    "X-Request-ID": genid.generateRandomUUID(),
    "X-Correlation-ID": genid.generateRandomUUID(),
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
  if (error.response.data.issue[0].hasOwnProperty("details")) {
    console.error(JSON.stringify(error.response.data.issue[0].details))
  } else if (error.response.data.issue[0].hasOwnProperty("diagnostics")){
    console.error(JSON.stringify(error.response.data.issue[0].diagnostics))
  }
  return Promise.reject(error);
});

export default instance;

function writeToFile(text, extension, prefix) {
  let user = process.env.GITHUB_USER;
  if (user == undefined) {
    user = process.env.USER;
  }
  try {
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }
    fs.mkdirSync(dir + "/" + user);
  } catch (e) { }
  let filename = dir + "/" + user + "/" + prefix + new Date().toISOString() + "." + extension
  fs.writeFileSync(filename, text);
}

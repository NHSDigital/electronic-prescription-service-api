import axios from "axios"
import qs from 'qs'
import {Req}  from '../src/configs/spec'
import DomParser from 'dom-parser'

let resp;
let code;


const config1 = {
  params: {
    client_id: process.env.client_id,
    redirect_uri: process.env.redirect_uri,
    state: process.env.state,
    response_type: process.env.response_type,
  }
};

const cookieJar = {
  myCookies: undefined,
};

async function authorize() {
  resp = await Req().adhocGet(`${process.env.base_url}/oauth2-mock/authorize`, config1)
  cookieJar.myCookies = resp.headers['set-cookie'];
  return resp
}

async function login(username) {
  const dom = new DomParser().parseFromString(resp.data.toString(), "text/html");
  const loginUrl = dom.getElementById('kc-form-login').getAttribute('action')
  let loginUrlclean = loginUrl.replaceAll("amp;", "")

  resp = await Req().adhocPost(loginUrlclean, qs.stringify({username: username}), {
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    cookie: cookieJar.myCookies
  });
  code = resp.request.path.match("(?<=[=]).*(?=[&])").toString()
}

export async function getToken(username){
  await authorize()
  await login(username)
  resp = await Req().adhocPost(`${process.env.base_url}/oauth2-mock/token`, qs.stringify({
    grant_type: "authorization_code",
    client_id: process.env.client_id,
    client_secret: process.env.client_secret,
    redirect_uri: process.env.redirect_uri,
    code: code
  }),
    { headers: {'Content-Type': 'application/x-www-form-urlencoded'}})
  console.log("======= Access Token ======== " + resp.data.access_token)
return resp.data.access_token
}

axios.interceptors.response.use(response => {
  return response;
}, error => {
  console.log(`Environment is ${process.env.NODE_ENV}`)
  console.log(`Status code ${error.response.status} : Message - ${error.response.statusText}`)
  console.log(error.response.data)
  console.log(JSON.stringify(error.response.data.issue[0].details))
  return Promise.reject(error);
});

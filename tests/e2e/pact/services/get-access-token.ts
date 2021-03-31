import {createJWT} from "./jwt"
import axios from "axios"
import {URLSearchParams} from "url"
import * as fs from "fs"
import path from "path"

/* TODO - get from ADO / env variables */
const internalDevApiKey = "4PD6IBEDrC4oVlQOJ5VSqk951SAqTA1G"
const internalDevPrivateKey = fs.readFileSync(path.join(__dirname, `jwtRS512.key`), "utf-8")
const audience = "https://internal-dev.api.service.nhs.uk/oauth2/token"
const keyId = "test-1"

interface TokenResponse {
  access_token: string
  expires_in: string
  token_type: "Bearer"
}

export async function getAuthToken(): Promise<string> {
  const urlParams = new URLSearchParams([
    ["grant_type", "client_credentials"],
    ["client_assertion_type", "urn:ietf:params:oauth:client-assertion-type:jwt-bearer"],
    ["client_assertion", createJWT(internalDevApiKey, audience, internalDevPrivateKey, keyId)]
  ])

  const axiosResponse = await axios.post(
    audience,
    urlParams,
    {headers: {"content-type": "application/x-www-form-urlencoded"}}
  )
  return (axiosResponse.data as TokenResponse).access_token
}

getAuthToken()
  .catch(error => console.log(error))
  .then(response => console.log(response))

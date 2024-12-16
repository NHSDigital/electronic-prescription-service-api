/**
 * TypeScript version of `identity_service.py` from pytest-nhsd-apim
 * https://github.com/NHSDigital/pytest-nhsd-apim/blob/82316e098a8696e4f7b0de7747b580dc0ffa7229/
 * /src/pytest_nhsd_apim/identity_service.py#L298
 *
 * 1. Hit `authorize` endpoint w/ required query params --> we
 * are redirected to the simulated_auth page. The requests package
 * follows those redirects.
 *
 * 2. Parse the login page.  For keycloak this presents an
 * HTML form, which must be filled in with valid data.  The tester
 * can submits their login data with the `login_form` field.
 *
 * 3. POST the filled in form. This is equivalent to clicking the
 * "Login" button if we were a human.
 *
 * 4. The mock auth redirected us back to the
 * identity-service, which redirected us to whatever our app's
 * callback-url was set to.  We don't actually care about the
 * content our callback-url page, we just need the auth_code that
 * was provided in the redirect.
 *
 * 5. Finally, get an access token.
 *
 * 6. Profit... sweet sweet profit.
 */
import axios, {AxiosInstance, AxiosResponse} from "axios"
import {JSDOM} from "jsdom"
import {wrapper} from "axios-cookiejar-support"
import {CookieJar} from "tough-cookie"

export const VALID_APIGEE_ENVIRONMENTS = [
  "internal-dev",
  "internal-qa",
  "int",
  "ref"
]

type EnvironmentSecrets = {
  clientId: string
  clientSecret: string
}

export class AuthClient {
  private readonly environment: string
  readonly clientId: string
  readonly clientSecret: string
  readonly callbackUrl: string
  private readonly state: string

  constructor() {
    const {clientId, clientSecret} = this.getApiCredentials()
    this.clientId = clientId
    this.clientSecret = clientSecret

    this.environment = this.getEnvironment()
    this.callbackUrl = "https://example.org/" // using /callback causes the website to return a 404, which upsets axios
    this.state = this.getState()
  }

  getBaseUrl(): string {
    return `https://${this.environment}.api.service.nhs.uk/oauth2-mock`
  }

  private getState(): string {
    // return uuid.v4()
    return "1234567890"
  }

  getEnvironment(): string {
    const env = process.env.APIGEE_ENVIRONMENT

    const isLocalEnv = process.env.NODE_ENV !== "production"
    const isValidEnv = VALID_APIGEE_ENVIRONMENTS.includes(env)
    if (!isLocalEnv && !isValidEnv) throw new Error(`Environment not supported: ${env}`)

    return env
  }

  private getApiCredentials = (): EnvironmentSecrets => {
    const clientId = process.env["API_CLIENT_ID"]
    const clientSecret = process.env["API_CLIENT_SECRET"]

    return {
      clientId,
      clientSecret
    }
  }

  getAuthParams(): Record<string, string> {
    return {
      client_id: this.clientId,
      redirect_uri: this.callbackUrl,
      state: this.state,
      response_type: "code"
    }
  }

  getAuthUrl(): string {
    return `/authorize`
  }

  getTokenUrl(): string {
    return `/token`
  }
}

export const getAuthForm = async (
  axiosInstance: AxiosInstance,
  requestUrl: string
): Promise<AxiosResponse> => {
  const response = await axiosInstance.get(requestUrl)

  if (response.status !== 200) {
    throw new Error(`Cannot retrieve auth token: ${requestUrl} returned ${response.data}`)
  }

  return response
}

type FormInputs = {
  username?: string
  login?: string
}

type FormModel = {
  action: string
  method: string
  data: FormInputs
}

export const parseAuthForm = (htmlForm: string): FormModel => {
  const {document} = (new JSDOM(htmlForm)).window
  const form = document.getElementById("kc-form-login")

  const formAction = form.getAttribute("action")
  const formMethod = form.getAttribute("method")
  const formInputs = form.getElementsByTagName("input")

  const inputs: FormInputs = {}
  for (const item of formInputs) {
    const name: string = item.getAttribute("name")
    const value: string = item.getAttribute("value")
    inputs[name] = value
  }

  // Set username with test user value, e.g. 656005750108
  inputs["username"] = "656005750108"

  return {
    action: formAction,
    method: formMethod,
    data: inputs
  }
}

/**
 *
 * @param url - the url to the /token endpoint
 * @param formData - key value map of the form inputs
 * @returns Apigee auth token
 */
export const sendAuthForm = async (axiosInstance: AxiosInstance, form: FormModel): Promise<AxiosResponse> => {
  const response = await axiosInstance.post(
    form.action,
    form.data,
    // {username: "656005750108"},
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    }
  )

  //NOSONAR
  // if (result.status !== 200) throw `Could not retrieve token: ${result.data}`

  return response
}

export const getAxiosInstance = (client: AuthClient): AxiosInstance => {
  const jar = new CookieJar()
  const axiosInstance = wrapper(axios.create({
    jar,
    // withCredentials: true,
    baseURL: client.getBaseUrl()
  }))

  return axiosInstance
}

type AuthCallbackResponseData = {
  code: string
  state: string
}

const parseAuthCallbackResponse = (authResponse: AxiosResponse): AuthCallbackResponseData => {
  const responsePath: string = authResponse.request.path

  const searchParams = new URLSearchParams(responsePath.substring(2)) // skip the leading `/?`
  return {
    code: searchParams.get("code"),
    state: searchParams.get("state")
  }
}

type TokenResponse = {
  access_token: string,
  expires_in: string,
  refresh_token: string,
  refresh_token_expires_in: string,
  refresh_count: string,
  token_type: string,
  sid: string
}

const exchangeCodeForToken = async (
  axiosClient: AxiosInstance,
  authClient: AuthClient,
  authCallbackData: AuthCallbackResponseData
): Promise<TokenResponse> => {
  const data = {
    grant_type: "authorization_code",
    code: authCallbackData.code,
    client_id: authClient.clientId,
    client_secret: authClient.clientSecret,
    redirect_uri: authClient.callbackUrl
  }

  const tokenResponse = await axiosClient.post(
    authClient.getTokenUrl(),
    data,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    }
  )

  return tokenResponse.data
}

export async function getAuthToken(): Promise<string> {
  const client = new AuthClient()
  const axiosInstance = getAxiosInstance(client)

  const query = Object.entries(client.getAuthParams()).map(([key, value]) => `${key}=${value}`).join("&")
  const authPath = `${client.getAuthUrl()}?${query}`

  const authFormResponse = await getAuthForm(axiosInstance, authPath)
  const authFormData = parseAuthForm(authFormResponse.data)

  const authFormSubmissionResponse = await sendAuthForm(axiosInstance, authFormData)
  const callbackData = parseAuthCallbackResponse(authFormSubmissionResponse)

  const tokenResponse = await exchangeCodeForToken(axiosInstance, client, callbackData)

  return tokenResponse.access_token
}

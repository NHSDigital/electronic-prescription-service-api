import React, {useContext, useState} from "react"
import {Button, Label} from "nhsuk-react-components"
import {AppContext} from "../index"
import {axiosInstance} from "../requests/axiosInstance"
import ButtonList from "../components/buttonList"
import {redirect} from "../browser/navigation"
import {isDev, isInt} from "../services/environment"

const LoginPage: React.FC = () => {
  const {baseUrl, environment} = useContext(AppContext)

  const [attendedAccessSelected, setAttendedAccessSelected] = useState(false)

  if (isInt(environment)) {
    makeLoginRequest(baseUrl, "cis2", "user")
    return <>
      <Label isPageHeading>Login</Label>
      <Label>Redirecting to auth...</Label>
    </>
  }

  if (attendedAccessSelected) {
    if (isDev(environment)) {
      makeLoginRequest(baseUrl, "simulated", "user")
      return <>
        <Label isPageHeading>Login</Label>
        <Label>Redirecting to simulated auth...</Label>
      </>
    }

    return <>
      <Label isPageHeading>Login</Label>
      <Label>Select auth method:</Label><ButtonList>
        <Button onClick={() => makeLoginRequest(baseUrl, "cis2", "user")}>CIS2</Button>
        <Button onClick={() => makeLoginRequest(baseUrl, "simulated", "user")}>Simulated</Button>
      </ButtonList>
    </>
  }

  return <>
    <Label isPageHeading>Login</Label>
    <Label>Select access level:</Label>
    <ButtonList>
      <Button onClick={() => setAttendedAccessSelected(true)}>User</Button>
      <Button onClick={() => makeLoginRequest(baseUrl, "", "system")}>System</Button>
    </ButtonList>
  </>
}

interface AuthResponse {
  redirectUri: string
}

const makeLoginRequest = async (baseUrl: string, authMethod: string, authLevel: string) => {
  const response = await axiosInstance.post<AuthResponse>(
    `${baseUrl}login`,
    {authMethod, authLevel}
  )
  redirect(`${response.data.redirectUri}`)
}

export default LoginPage

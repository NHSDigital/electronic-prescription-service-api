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
    makeAttendedLoginRequest(baseUrl, "cis2")
    return <>
      <Label isPageHeading>Login</Label>
      <Label>Redirecting to auth...</Label>
    </>
  }

  if (attendedAccessSelected) {
    if (isDev(environment)) {
      makeAttendedLoginRequest(baseUrl, "simulated")
      return <>
        <Label isPageHeading>Login</Label>
        <Label>Redirecting to simulated auth...</Label>
      </>
    }

    return <>
      <Label isPageHeading>Login</Label>
      <Label>Select auth method:</Label><ButtonList>
        <Button type="submit" onClick={() => makeAttendedLoginRequest(baseUrl, "cis2")}>CIS2</Button>
        <Button type="submit" onClick={() => makeAttendedLoginRequest(baseUrl, "simulated")}>Simulated</Button>
      </ButtonList>
    </>
  }

  return <>
    <Label isPageHeading>Login</Label>
    <Label>Select access level:</Label>
    <ButtonList>
      <Button type="submit" onClick={() => setAttendedAccessSelected(true)}>User</Button>
      <Button type="submit" onClick={() => makeUnattendedLoginRequest(baseUrl)}>System</Button>
    </ButtonList>
  </>
}

interface AuthResponse {
  redirectUri: string
}

const makeAttendedLoginRequest = async (baseUrl: string, authMethod: string) => {
  const response = await axiosInstance.post<AuthResponse>(
    `${baseUrl}login`,
    {authMethod}
  )
  redirect(`${response.data.redirectUri}`)
}

const makeUnattendedLoginRequest = async (baseUrl: string) => {
  const response = await axiosInstance.post<AuthResponse>(`${baseUrl}unattended-login`)
  redirect(`${response.data.redirectUri}`)
}

export default LoginPage

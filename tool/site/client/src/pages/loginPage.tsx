import React, {useContext, useState} from "react"
import {Button, Label} from "nhsuk-react-components"
import {AppContext} from "../index"
import {axiosInstance} from "../requests/axiosInstance"
import ButtonList from "../components/common/buttonList"
import {redirect} from "../browser/navigation"
import {isDev, isInt, isQa} from "../services/environment"

const LoginPage: React.FC = () => {
  const {baseUrl, environment} = useContext(AppContext)

  const [attendedAccessSelected, setAttendedAccessSelected] = useState(false)

  if (isInt(environment)) {
    makeLoginRequest(baseUrl, "user")
    return <>
      <Label isPageHeading>Login</Label>
      <Label>Redirecting to auth...</Label>
    </>
  }

  if (attendedAccessSelected) {
    if (isDev(environment) || isQa(environment)) {
      makeLoginRequest(baseUrl, "user")
      return <>
        <Label isPageHeading>Login</Label>
        <Label>Redirecting to simulated auth...</Label>
      </>
    }
  }

  return <>
    <Label isPageHeading>Login</Label>
    <Label>Select access level:</Label>
    <ButtonList>
      <Button onClick={() => setAttendedAccessSelected(true)}>User</Button>
      <Button onClick={() => makeLoginRequest(baseUrl, "system")}>System</Button>
    </ButtonList>
  </>
}

interface AuthResponse {
  redirectUri: string
}

const makeLoginRequest = async (baseUrl: string, authLevel: string) => {
  const response = await axiosInstance.post<AuthResponse>(
    `${baseUrl}login`,
    {authLevel}
  )
  redirect(`${response.data.redirectUri}`)
}

export default LoginPage

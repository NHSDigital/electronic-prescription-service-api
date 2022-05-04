import React, {useContext, useState} from "react"
import {Button, Label} from "nhsuk-react-components"
import {AppContext} from "../index"
import {axiosInstance} from "../requests/axiosInstance"
import ButtonList from "../components/common/buttonList"
import {redirect} from "../browser/navigation"
import {isDev, isInt, isQa} from "../services/environment"

const LoginPage: React.FC <{separateAuth?:string}> = ({separateAuth}) => {
  const {baseUrl, environment} = useContext(AppContext)

  const [combinedAuthSelected, setCombinedAuthSelected] = useState(false)

  if (isInt(environment)) {
    makeLoginRequest(baseUrl, separateAuth ? "user-separate" : "user-combined")
    return <>
      <Label isPageHeading>Login</Label>
      <Label>Redirecting to auth...</Label>
    </>
  }

  if (combinedAuthSelected) {
    if (isDev(environment) || isQa(environment)) {
      makeLoginRequest(baseUrl, "user-combined")
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
      <Button onClick={() => setCombinedAuthSelected(true)}>User - Combined Auth</Button>
      <Button onClick={() => makeLoginRequest(baseUrl, "user-separate")}>User - Separate Auth</Button>
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

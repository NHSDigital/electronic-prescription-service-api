import React, {useContext, useEffect, useState} from "react"
import {Button, Label} from "nhsuk-react-components"
import {AppContext} from "../index"
import {axiosInstance} from "../requests/axiosInstance"
import ButtonList from "../components/common/buttonList"
import {redirect} from "../browser/navigation"
import {isInternalDev, isInternalDevSandbox, isInt, isQa} from "../services/environment"

const LoginPage: React.FC<{separateAuth?: string}> = ({separateAuth}) => {
  const {baseUrl, environment} = useContext(AppContext)

  const [mockAuthSelected, setMockAuthSelected] = useState(false)
  
  useEffect(() => {
    if (isInternalDev(environment)) {
      setDefaultDevConfig(baseUrl)
    }
  }, [])

  if (isInt(environment)) {
    makeLoginRequest(baseUrl, separateAuth ? "user-separate" : "user-combined")
    return (
      <>
        <Label isPageHeading>Login</Label>
        <Label>Redirecting to auth...</Label>
      </>
    )
  }

  if (mockAuthSelected) {
    if (isInternalDev(environment) || isInternalDevSandbox(environment) || isQa(environment)) {
      makeLoginRequest(baseUrl, "user-mock")
      return (
        <>
          <Label isPageHeading>Login</Label>
          <Label>Redirecting to simulated auth...</Label>
        </>
      )
    }
  }

  return (
    <>
      <Label isPageHeading>Login</Label>
      {isInternalDev(environment) || isInternalDevSandbox(environment) || isQa(environment) ? <Label>When prompted enter the following User Id: 555086689106</Label> : <></>}
      <Label>Select access level:</Label>
      <ButtonList>
        <Button onClick={() => setMockAuthSelected(true)}>User - Mock</Button>
        <Button onClick={() => makeLoginRequest(baseUrl, "system")}>System</Button>
      </ButtonList>
    </>
  )
}

interface AuthResponse {
  redirectUri: string
}

const makeLoginRequest = async (baseUrl: string, authLevel: string) => {
  const response = await axiosInstance.post<AuthResponse>(`${baseUrl}login`, {authLevel})
  redirect(`${response.data.redirectUri}`)
}

async function setDefaultDevConfig(
  baseUrl: string
): Promise<void> {
  const defaultDevConfig = {useSigningMock: true, epsPrNumber: "", signingPrNumber: "", useProxygen: false}
  await axiosInstance.post(`${baseUrl}config`, defaultDevConfig)
}
export default LoginPage

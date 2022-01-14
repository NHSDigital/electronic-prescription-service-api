import React, {useContext, useState} from "react"
import {Button} from "nhsuk-react-components"
import {AppContext} from "../index"
import {axiosInstance} from "../requests/axiosInstance"
import ButtonList from "../components/buttonList"
import {redirect} from "../browser/navigation"

const LoginPage: React.FC = () => {
  const {baseUrl} = useContext(AppContext)

  const [pressedUserButton, setPressedUserButton] = useState(false)

  return <>
    <h1>Select access level</h1>
    {!pressedUserButton ? <>
      <p>I am a:</p>
      <ButtonList>
        <Button type="submit" onClick={() => setPressedUserButton(true)}>User</Button>
        <Button type="submit" onClick={() => makeUnattendedLoginRequest(baseUrl)}>System</Button>
      </ButtonList>
    </> : <>
      <p>Select auth method:</p>
      <ButtonList>
        <Button type="submit" onClick={() => makeAttendedLoginRequest(baseUrl, "cis2")}>CIS2</Button>
        <Button type="submit" onClick={() => makeAttendedLoginRequest(baseUrl, "simulated")}>Simulated</Button>
      </ButtonList>
    </>}
  </>
}

interface ChangeAuthResponse {
  redirectUri: string
}

const makeAttendedLoginRequest = async (baseUrl: string, authMethod: string) => {
  const response = await axiosInstance.post<ChangeAuthResponse>(
    `${baseUrl}change-auth`,
    {authMethod}
  )
  redirect(`${response.data.redirectUri}`)
}

const makeUnattendedLoginRequest = async (baseUrl: string) => {
  await axiosInstance.post(`${baseUrl}unattended-login`)

  return redirect(`${baseUrl}callback`)
}

export default LoginPage

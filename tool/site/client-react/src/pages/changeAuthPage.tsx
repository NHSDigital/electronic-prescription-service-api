import React, {useContext, useState} from "react"
import {Button, Label} from "nhsuk-react-components"
import {AppContext} from "../index"
import {axiosInstance} from "../requests/axiosInstance"
import ButtonList from "../components/buttonList"
import {redirect} from "../browser/navigation"

const ChangeAuthPage: React.FC = () => {
  const {baseUrl} = useContext(AppContext)

  const [pressedUserButton, setPressedUserButton] = useState(false)

  return <>
    <Label isPageHeading>Change auth</Label>
    {!pressedUserButton ? <>
      <Label>Select access level:</Label>
      <ButtonList>
        <Button type="submit" onClick={() => setPressedUserButton(true)}>User</Button>
        <Button type="submit" onClick={() => makeUnattendedLoginRequest(baseUrl)}>System</Button>
      </ButtonList>
    </> : <>
      <Label>Select auth method:</Label>
      <ButtonList>
        <Button type="submit" onClick={() => makeAttendedLoginRequest(baseUrl, "cis2")}>CIS2</Button>
        <Button type="submit" onClick={() => makeAttendedLoginRequest(baseUrl, "simulated")}>Simulated</Button>
      </ButtonList>
    </>}
  </>
}

interface AuthResponse {
  redirectUri: string
  tokenStuff: string
}

const makeAttendedLoginRequest = async (baseUrl: string, authMethod: string) => {
  const response = await axiosInstance.post<AuthResponse>(
    `${baseUrl}change-auth`,
    {authMethod}
  )
  redirect(`${response.data.redirectUri}`)
}

const makeUnattendedLoginRequest = async (baseUrl: string) => {
  const response = await axiosInstance.post<AuthResponse>(`${baseUrl}unattended-login`)

  console.log(response.data.tokenStuff)
  redirect(`${response.data.redirectUri}`)
}

export default ChangeAuthPage

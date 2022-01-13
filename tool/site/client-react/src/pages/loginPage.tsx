import React, {useContext} from "react"
import {Button} from "nhsuk-react-components"
import {AppContext} from "../index"
import {axiosInstance} from "../requests/axiosInstance"
import ButtonList from "../components/buttonList"
import {redirect} from "../browser/navigation"

const LoginPage: React.FC = () => {
  const {baseUrl} = useContext(AppContext)
  return <>
    <h1>Select access level:</h1>
    <ButtonList>
      <Button type="submit" onClick={() => makeAttendedLoginRequest(baseUrl)}>User</Button>
      <Button type="submit" onClick={() => makeUnattendedLoginRequest(baseUrl)}>System</Button>
    </ButtonList>
  </>
}

const makeAttendedLoginRequest = async (baseUrl: string) => {
  await axiosInstance.post(`${baseUrl}attended-login`)

  return redirect(`${baseUrl}callback`)
}

const makeUnattendedLoginRequest = async (baseUrl: string) => {
  await axiosInstance.post(`${baseUrl}unattended-login`)

  return redirect(`${baseUrl}callback`)
}

export default LoginPage

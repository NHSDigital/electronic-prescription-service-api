import React, {useContext} from "react"
import {Button} from "nhsuk-react-components"
import {AppContext} from "../index"
import {axiosInstance} from "../requests/axiosInstance"
import ButtonList from "../components/buttonList"

const LoginPage: React.FC = () => {
  const {baseUrl} = useContext(AppContext)
  return <ButtonList>
    <Button type="button" onClick={() => makeAttendedLoginRequest(baseUrl)}>Attended</Button>
    <Button type="button">Unattended</Button>
  </ButtonList>
}

const makeAttendedLoginRequest = async (baseUrl: string) => {
  return await axiosInstance.post(`${baseUrl}attended-login`)
}

export default LoginPage

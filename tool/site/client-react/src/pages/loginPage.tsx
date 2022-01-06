import React, {useContext} from "react"
import {Button} from "nhsuk-react-components"
import {AppContext} from "../index"
import {axiosInstance} from "../requests/axiosInstance"

const LoginPage: React.FC = () => {
  const {baseUrl} = useContext(AppContext)
  return <>
    <Button type="button" onClick={() => makeAttendedLoginRequest(baseUrl)}>Attended</Button>
    <Button type="button">Unattended</Button>
  </>
}

const makeAttendedLoginRequest = async (baseUrl: string) => {
  return await axiosInstance.get(`${baseUrl}/attended-login`)
}

export default LoginPage

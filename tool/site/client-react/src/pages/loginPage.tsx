import React, {useContext} from "react"
import {Button} from "nhsuk-react-components"
import {AppContext} from "../index"
import {axiosInstance} from "../requests/axiosInstance"
import ButtonList from "../components/buttonList"

const LoginPage: React.FC = () => {
  const {baseUrl} = useContext(AppContext)
  return <>
    <pre>Select access level:</pre>
    <ButtonList>
      <Button type="button" onClick={() => makeAttendedLoginRequest(baseUrl)}>User</Button>
      <Button type="button">System</Button>
    </ButtonList>
  </>
}

const makeAttendedLoginRequest = async (baseUrl: string) => {
  return await axiosInstance.post(`${baseUrl}attended-login`)
}

export default LoginPage

import React, {useContext} from "react"
import {Button} from "nhsuk-react-components"
import {AppContext} from "../index"
import {axiosInstance} from "../requests/axiosInstance"
import ButtonList from "../components/buttonList"

const LoginPage: React.FC = () => {
  const {baseUrl} = useContext(AppContext)
  return <>
    <h1>Select access level:</h1>
    <ButtonList>
      <Button type="submit" onClick={() => makeAttendedLoginRequest(baseUrl)}>User</Button>
      <Button type="submit">System</Button>
    </ButtonList>
  </>
}

const makeAttendedLoginRequest = async (baseUrl: string) => {
  return await axiosInstance.post(`${baseUrl}attended-login`)
}

export default LoginPage

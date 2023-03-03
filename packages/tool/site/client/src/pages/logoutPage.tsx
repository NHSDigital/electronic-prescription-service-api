import {ActionLink, Label} from "nhsuk-react-components"
import * as React from "react"
import {AppContext} from "../index"

const LogoutPage: React.FC = () => {
  const {baseUrl} = React.useContext(AppContext)

  return (
    <>
      <Label isPageHeading>You have been logged out</Label>
      <Label>Use the link below if you want to login again.</Label>
      <ActionLink href={`${baseUrl}login`}>Login</ActionLink>
    </>
  )
}

export default LogoutPage

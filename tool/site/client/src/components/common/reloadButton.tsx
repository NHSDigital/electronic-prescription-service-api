import {Button} from "nhsuk-react-components"
import React from "react"
import {redirect} from "../../browser/navigation"

export const ReloadButton : React.FC = () => {
  return <Button type="button" onClick={() => redirect("javascript:window.location.href=window.location.href")} secondary>Back</Button>
}

export default ReloadButton

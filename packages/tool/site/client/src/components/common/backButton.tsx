import {Button} from "nhsuk-react-components"
import React from "react"
import {useHistory} from "react-router-dom"

export const BackButton : React.FC = () => {
  const history = useHistory()
  return <Button type="button" secondary onClick={() => history.goBack()}>Back</Button>
}

export default BackButton

import {Button} from "nhsuk-react-components"
import React from "react"
import {useNavigate} from "react-router-dom"

export const BackButton : React.FC = () => {
  const navigate = useNavigate()
  return <Button type="button" secondary onClick={() => navigate(-1)}>Back</Button>
}

export default BackButton

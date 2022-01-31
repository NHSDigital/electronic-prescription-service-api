import {ActionLink, Label} from "nhsuk-react-components"
import * as React from "react"
import {useContext} from "react"
import {AppContext} from "../index"

const HomePage: React.FC = () => {
  const {baseUrl} = useContext(AppContext)

  return (
    <>
      <Label isPageHeading>I would like to...</Label>
      <ActionLink href={`${baseUrl}prescribe/load`}>
        Create Prescription(s)
      </ActionLink>
      <ActionLink href={`${baseUrl}dispense/release`}>
        Release Prescription(s)
      </ActionLink>
      <ActionLink href={`${baseUrl}search`}>
        Check Prescription(s) status
      </ActionLink>
      <ActionLink href={`${baseUrl}validate`}>
        Validate a FHIR Resource
      </ActionLink>
    </>
  )
}

export default HomePage

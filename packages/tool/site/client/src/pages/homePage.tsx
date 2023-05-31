import {ActionLink, Label} from "nhsuk-react-components"
import * as React from "react"
import {useContext} from "react"
import {AppContext} from "../index"
import {isInternalDevSandbox, isSandbox} from "../services/environment"

const HomePage: React.FC = () => {
  const {baseUrl, environment} = useContext(AppContext)

  return (
    <>
      <Label isPageHeading>I would like to...</Label>
      {isSandbox(environment)
        ? <ActionLink href={`${baseUrl}dose-to-text`}>Convert dose to text</ActionLink>
        : <>
          <ActionLink href={`${baseUrl}prescribe/load`}>Create Prescription(s)</ActionLink>
          <ActionLink href={`${baseUrl}dispense/release`}>Release Prescription(s)</ActionLink>
          <ActionLink href={`${baseUrl}search`}>Check Prescription(s) status</ActionLink>
          <ActionLink href={`${baseUrl}validate`}>Validate a FHIR Resource</ActionLink>
          <ActionLink href={`${baseUrl}compare-prescriptions`}>Compare Prescriptions</ActionLink>
          {isInternalDevSandbox(environment) && <ActionLink href={`${baseUrl}dose-to-text`}>Convert dose to text</ActionLink>}
        </>
      }
    </>
  )
}

export default HomePage

import PrescriptionSummaryView, {createSummaryPrescription} from "../components/prescription-summary/prescriptionSummaryView"
import * as React from "react"
import {useContext, useState} from "react"
import {Bundle, OperationOutcome} from "fhir/r4"
import axios from "axios"
import LongRunningTask from "../components/longRunningTask"
import {AppContext} from "../index"
import {ActionLink, Button, Label} from "nhsuk-react-components"
import ButtonList from "../components/buttonList"

interface PrescriptionSummaryPageProps {
  prescriptionId: string
}

const PrescriptionSummaryPage: React.FC<PrescriptionSummaryPageProps> = ({
  prescriptionId
}) => {
  const {baseUrl} = useContext(AppContext)
  const [confirmed, setConfirmed] = useState<boolean>(false)
  return (
    <LongRunningTask<Bundle> task={() => retrievePrescription(baseUrl, prescriptionId)} message="Retrieving prescription details.">
      {bundle => {
        if (!confirmed) {
          const summaryViewProps = createSummaryPrescription(bundle)
          return (
            <>
              <PrescriptionSummaryView {...summaryViewProps}/>
              <ButtonList>
                <Button onClick={() => setConfirmed(true)}>Send</Button>
                <Button secondary href={baseUrl}>Back</Button>
              </ButtonList>
            </>
          )
        }

        return (
          <LongRunningTask<SignResponse> task={() => sendSignRequest(baseUrl)} message="Sending signature request.">
            {signResponse => (
              <>
                <Label isPageHeading>Upload Complete</Label>
                <Label>Use the link below if you are not redirected automatically.</Label>
                <ActionLink href={signResponse.redirectUri}>Proceed to the Signing Service</ActionLink>
              </>
            )}
          </LongRunningTask>
        )
      }}
    </LongRunningTask>
  )
}

async function retrievePrescription(baseUrl: string, prescriptionId: string): Promise<Bundle> {
  const response = await axios.get<Bundle>(`${baseUrl}prescription/${prescriptionId}`)
  return response.data
}

async function sendSignRequest(baseUrl: string) {
  const response = await axios.post<SignResponse>(`${baseUrl}prescribe/sign`)
  const prepareErrors = response.data.prepareErrors
  if (prepareErrors) {
    prepareErrors
      .flatMap(error => error.issue)
      .filter(issue => issue.severity === "error")
      .filter(issue => !issue.diagnostics.startsWith("Unable to find matching profile for urn:uuid:"))
      .map(issue => issue.diagnostics)
      .forEach(diagnostic => console.log(diagnostic))
    throw new Error("Error preparing prescription for signing. Check the console for details.")
  }

  const redirectUri = response.data.redirectUri
  if (!redirectUri) {
    throw new Error("Unable to sign prescription, this is most likely because your session has expired. Please try to change-auth or login again")
  }

  window.location.href = redirectUri
  return response.data
}

interface SignResponse {
  redirectUri?: string
  prepareErrors?: Array<OperationOutcome>
}

export default PrescriptionSummaryPage

import PrescriptionSummaryView, {createSummaryPrescription} from "../components/prescription-summary/prescriptionSummaryView"
import * as React from "react"
import {useCallback, useContext, useEffect, useState} from "react"
import {useCookies} from "react-cookie"
import {Bundle, OperationOutcome} from "fhir/r4"
import axios from "axios"
import LongRunningTask from "../components/longRunningTask"
import {AppContext} from "../index"
import {ActionLink, Button, Label} from "nhsuk-react-components"
import ButtonList from "../components/buttonList"
import {redirect} from "../browser/navigation"

interface SendPreSignPageProps {
  prescriptionId: string
}

const SendPreSignPage: React.FC<SendPreSignPageProps> = ({
  prescriptionId
}) => {
  const {baseUrl} = useContext(AppContext)
  const [sendConfirmed, setSendConfirmed] = useState<boolean>(false)
  const retrievePrescriptionTask = () => retrievePrescription(baseUrl, prescriptionId)

  /* Pagination ------------------------------------------------ */
  const [addedListener, setAddedListener] = useState(false)
  const [cookies] = useCookies()
  const LEFT_ARROW_KEY = 37
  const RIGHT_ARROW_KEY = 39
  const handleKeyDown = useCallback((e: any) => {
    if (e.keyCode === LEFT_ARROW_KEY) {
      const previousPrescriptionId = cookies["Previous-Prescription-Id"]
      if (previousPrescriptionId) {
        redirect(`${baseUrl}prescribe/edit?prescription_id=${encodeURIComponent(previousPrescriptionId)}`)
      }
    } else if (e.keyCode === RIGHT_ARROW_KEY) {
      const nextPrescriptionId = cookies["Next-Prescription-Id"]
      if (nextPrescriptionId) {
        redirect(`${baseUrl}prescribe/edit?prescription_id=${encodeURIComponent(nextPrescriptionId)}`)
      }
    }
  }, [baseUrl, cookies])
  useEffect(() => {
    if (!addedListener) {
      document.addEventListener("keydown", handleKeyDown)
    }
    setAddedListener(true)
  }, [addedListener, handleKeyDown])
  /* ---------------------------------------------------------- */

  return (
    <LongRunningTask<Bundle> task={retrievePrescriptionTask} loadingMessage="Retrieving prescription details.">
      {bundle => {
        if (!sendConfirmed) {
          const summaryViewProps = createSummaryPrescription(bundle)
          return (
            <>
              <PrescriptionSummaryView {...summaryViewProps}/>
              <ButtonList>
                <Button onClick={() => setSendConfirmed(true)}>Send</Button>
                <Button secondary href={baseUrl}>Back</Button>
              </ButtonList>
            </>
          )
        }

        const sendSignRequestTask = () => sendSignRequest(baseUrl)
        return (
          <LongRunningTask<SignResponse> task={sendSignRequestTask} loadingMessage="Sending signature request.">
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

  redirect(redirectUri)
  return response.data
}

interface SignResponse {
  redirectUri?: string
  prepareErrors?: Array<OperationOutcome>
}

export default SendPreSignPage

import PrescriptionSummaryView, {createSummaryPrescription} from "../components/prescription-summary/prescriptionSummaryView"
import * as React from "react"
import {useCallback, useContext, useEffect, useState} from "react"
import {useCookies} from "react-cookie"
import {Bundle, OperationOutcome} from "fhir/r4"
import LongRunningTask from "../components/longRunningTask"
import {AppContext} from "../index"
import {ActionLink, Button, Label} from "nhsuk-react-components"
import ButtonList from "../components/buttonList"
import {isBundle} from "../fhir/typeGuards"
import {redirect} from "../browser/navigation"
import {getResponseDataIfValid} from "../requests/getValidResponse"
import {axiosInstance} from "../requests/axiosInstance"
import BackButton from "../components/backButton"

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
                <BackButton/>
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
  const response = await axiosInstance.get<Bundle | OperationOutcome>(`${baseUrl}prescription/${prescriptionId}`)
  return getResponseDataIfValid(response, isBundle)
}

async function sendSignRequest(baseUrl: string) {
  const response = await axiosInstance.post<SignResponse>(`${baseUrl}prescribe/sign`)
  const signResponse = getResponseDataIfValid(response, isSignResponse)
  const prepareErrors = signResponse.prepareErrors
  if (prepareErrors) {
    prepareErrors
      .flatMap(error => error.issue)
      .filter(issue => issue.severity === "error")
      .filter(issue => !issue.diagnostics.startsWith("Unable to find matching profile for urn:uuid:"))
      .map(issue => issue.diagnostics)
      .forEach(diagnostic => console.log(diagnostic))
    throw new Error("Error preparing prescription for signing. Check the console for details.")
  }

  redirect(signResponse.redirectUri)
  return signResponse
}

function isSignResponse(data: unknown): data is SignResponse {
  const signResponse = data as SignResponse
  return "redirectUri" in signResponse || "prepareErrors" in signResponse
}

interface SignResponse {
  redirectUri?: string
  prepareErrors?: Array<OperationOutcome>
}

export default SendPreSignPage

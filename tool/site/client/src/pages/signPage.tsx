import PrescriptionSummaryView, {createSummaryPrescriptionViewProps, PrescriptionSummaryErrors} from "../components/prescription-summary/prescriptionSummaryView"
import * as React from "react"
import {useCallback, useContext, useEffect, useState} from "react"
import {useCookies} from "react-cookie"
import {Bundle, OperationOutcome} from "fhir/r4"
import LongRunningTask from "../components/common/longRunningTask"
import {AppContext} from "../index"
import {ActionLink, Button, Form, Label} from "nhsuk-react-components"
import ButtonList from "../components/common/buttonList"
import {isBundle} from "../fhir/typeGuards"
import {redirect} from "../browser/navigation"
import {getResponseDataIfValid} from "../requests/getValidResponse"
import {axiosInstance} from "../requests/axiosInstance"
import BackButton from "../components/common/backButton"
import {Formik, FormikErrors} from "formik"
import {getMedicationRequestResources} from "../fhir/bundleResourceFinder"
import {updateBundleIds} from "../fhir/helpers"

interface SignPageProps {
  prescriptionId: string
}

interface SignPageFormValues {
  numberOfCopies: string
  nominatedOds: string
}

type SignPageFormErrors = PrescriptionSummaryErrors

const SignPage: React.FC<SignPageProps> = ({
  prescriptionId
}) => {
  const {baseUrl} = useContext(AppContext)
  const [editMode, setEditMode] = useState(false)
  const [signPageFormValues, setSignPageFormValues] = useState<SignPageFormValues>()
  const retrievePrescriptionTask = () => retrievePrescription(baseUrl, prescriptionId)

  const validate = (values: SignPageFormValues) => {
    const errors: FormikErrors<SignPageFormErrors> = {}

    const copiesError = "Please provide a number of copies between 1 and 25"
    if (!values.numberOfCopies) {
      errors.numberOfCopies = copiesError
    } else {
      const copies = parseInt(values.numberOfCopies)
      if (copies < 1 || isNaN(copies) || copies > 25) {
        errors.numberOfCopies = copiesError
      }
    }

    return errors
  }

  /* Pagination ------------------------------------------------ */
  const [addedListener, setAddedListener] = useState(false)
  const [cookies] = useCookies()
  const LEFT_ARROW_KEY = 37
  const RIGHT_ARROW_KEY = 39
  const handleKeyDown = useCallback((e: any) => {
    if (e.keyCode === LEFT_ARROW_KEY) {
      const previousPrescriptionId = cookies["Previous-Prescription-Id"]
      if (previousPrescriptionId) {
        redirect(`${baseUrl}prescribe/sign?prescription_id=${encodeURIComponent(previousPrescriptionId)}`)
      }
    } else if (e.keyCode === RIGHT_ARROW_KEY) {
      const nextPrescriptionId = cookies["Next-Prescription-Id"]
      if (nextPrescriptionId) {
        redirect(`${baseUrl}prescribe/sign?prescription_id=${encodeURIComponent(nextPrescriptionId)}`)
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
        if (!signPageFormValues) {
          const summaryViewProps = createSummaryPrescriptionViewProps(bundle, editMode, setEditMode)

          const initialValues = {
            numberOfCopies: "1",
            nominatedOds: summaryViewProps.prescriptionLevelDetails.nominatedOds
          }

          return (
            <Formik<SignPageFormValues>
              initialValues={initialValues}
              onSubmit={setSignPageFormValues}
              validate={validate}
              validateOnBlur={false}
              validateOnChange={false}
            >
              {({handleSubmit, handleReset, errors}) =>
                <Form onSubmit={handleSubmit} onReset={handleReset}>
                  <PrescriptionSummaryView {...summaryViewProps} editMode={editMode} errors={errors} />
                  <ButtonList>
                    <Button>Send</Button>
                    <BackButton/>
                  </ButtonList>
                </Form>
              }
            </Formik>
          )
        }

        const sendSignRequestTask = () => sendSignRequest(baseUrl, signPageFormValues)
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

async function sendSignRequest(baseUrl: string, sendPageFormValues: SignPageFormValues) {
  await updateEditedPrescriptions(sendPageFormValues, baseUrl)
  const response = await axiosInstance.post<SignResponse>(`${baseUrl}api/prescribe/sign`)
  const signResponse = getResponseDataIfValid(response, isSignResponse)
  redirect(signResponse.redirectUri)
  return signResponse
}

async function updateEditedPrescriptions(sendPageFormValues: SignPageFormValues, baseUrl: string) {
  const currentPrescriptions = (await axiosInstance.get(`${baseUrl}prescriptions`)).data as Array<Bundle>
  if (sendPageFormValues.nominatedOds) {
    currentPrescriptions.forEach(prescription => {
      const medicationRequests = getMedicationRequestResources(prescription)
      medicationRequests.forEach(medication => {
        const performer = medication.dispenseRequest?.performer
        if (performer) {
          performer.identifier.value = sendPageFormValues.nominatedOds
        }
      })
    })
  }
  const newPrescriptions: Array<Bundle> = currentPrescriptions
    .map(prescription => createEmptyArrayOfSize(sendPageFormValues.numberOfCopies)
      .fill(prescription)
      .map(prescription => clone(prescription))
    ).flat()
  newPrescriptions.forEach(prescription => updateBundleIds(prescription))
  await axiosInstance.post(`${baseUrl}api/prescribe/sign`, newPrescriptions)
}

function createEmptyArrayOfSize(numberOfCopies: string) {
  return Array(parseInt(numberOfCopies))
}

function clone(p: any): any {
  return JSON.parse(JSON.stringify(p))
}

function isSignResponse(data: unknown): data is SignResponse {
  const signResponse = data as SignResponse
  return "redirectUri" in signResponse
}

interface SignResponse {
  redirectUri?: string
  prepareErrors?: Array<OperationOutcome>
}

export default SignPage

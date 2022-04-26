import PrescriptionSummaryView, {createSummaryPrescriptionViewProps, PrescriptionSummaryErrors} from "../components/prescription-summary/prescriptionSummaryView"
import * as React from "react"
import {useCallback, useContext, useEffect, useState} from "react"
import {useCookies} from "react-cookie"
import {Bundle, OperationOutcome} from "fhir/r4"
import LongRunningTask from "../components/common/longRunningTask"
import {AppContext} from "../index"
import {ActionLink, Button, Form, Label, Table} from "nhsuk-react-components"
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
  prescriptionId?: string
}

interface EditPrescriptionValues {
  numberOfCopies: string
  nominatedOds: string
  prescriptionId: string
}

interface SignPageFormValues {
  editedPrescriptions: Array<EditPrescriptionValues>
}

interface PrescriptionSummaries {
  editingPrescriptions: Array<{bundleId: string, prescriptionId: string}>
}

type SignPageFormErrors = PrescriptionSummaryErrors

const SignPage: React.FC<SignPageProps> = ({
  prescriptionId
}) => {
  const {baseUrl} = useContext(AppContext)
  const [editMode, setEditMode] = useState(false)
  const [sendPageFormValues, setSendPageFormValues] = useState<SignPageFormValues>({editedPrescriptions: []})
  const retrievePrescriptionSummariesTask = () => retrievePrescriptionSummaries(baseUrl)
  const retrievePrescriptionDetailTask = () => retrievePrescription(baseUrl, prescriptionId)

  const validate = (values: EditPrescriptionValues) => {
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

  if (!prescriptionId) {
    return <LongRunningTask<PrescriptionSummaries> task={retrievePrescriptionSummariesTask} loadingMessage="Retrieving prescription details.">
      {summaries => {
        return (
          <>
            <Label isPageHeading>Prescriptions to Send</Label>
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.Cell>Bundle Id</Table.Cell>
                  <Table.Cell>Prescription Id</Table.Cell>
                  <Table.Cell>View</Table.Cell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {summaries.editingPrescriptions.map(summary =>
                  <Table.Row>
                    <Table.Cell>{summary.bundleId}</Table.Cell>
                    <Table.Cell>{summary.prescriptionId}</Table.Cell>
                    <Table.Cell>
                      <ActionLink href={`${baseUrl}prescribe/edit?prescription_id=${encodeURIComponent(summary.prescriptionId)}`}>
                        View
                      </ActionLink>
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table>
          </>
        )
      }}
    </LongRunningTask>
  }

  return (
    <LongRunningTask<Bundle> task={retrievePrescriptionDetailTask} loadingMessage="Retrieving prescription details.">
      {bundle => {
        if (sendPageFormValues.editedPrescriptions.length === 0) {
          const summaryViewProps = createSummaryPrescriptionViewProps(bundle, editMode, setEditMode)

          const initialValues = {
            numberOfCopies: "1",
            nominatedOds: summaryViewProps.prescriptionLevelDetails.nominatedOds,
            prescriptionId
          }

          const updateEditedPrescription = (values: EditPrescriptionValues): void => {
            const previouslyEdited = sendPageFormValues.editedPrescriptions
            if (previouslyEdited.every(prescription => prescription.prescriptionId !== values.prescriptionId)) {
              previouslyEdited.push(values)
            }
            setSendPageFormValues({editedPrescriptions: previouslyEdited})
          }

          return (
            <Formik<EditPrescriptionValues>
              initialValues={initialValues}
              onSubmit={updateEditedPrescription}
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

        const sendSignatureUploadTask = () => sendSignatureUploadRequest(baseUrl, sendPageFormValues)
        return (
          <LongRunningTask<SignResponse> task={sendSignatureUploadTask} loadingMessage="Sending signature request.">
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

async function retrievePrescriptionSummaries(baseUrl: string): Promise<PrescriptionSummaries> {
  const response = await axiosInstance.get<PrescriptionSummaries>(`${baseUrl}prescriptionIds`)
  return response.data
}

async function sendSignatureUploadRequest(baseUrl: string, sendPageFormValues: SignPageFormValues) {
  await updateEditedPrescriptions(sendPageFormValues, baseUrl)
  const response = await axiosInstance.post<SignResponse>(`${baseUrl}sign/upload-signatures`)
  const signResponse = getResponseDataIfValid(response, isSignResponse)
  redirect(signResponse.redirectUri)
  return signResponse
}

async function updateEditedPrescriptions(sendPageFormValues: SignPageFormValues, baseUrl: string) {
  const currentPrescriptions = (await axiosInstance.get(`${baseUrl}prescriptions`)).data as Array<Bundle>
  const {editedPrescriptions} = sendPageFormValues

  const updatedPrescriptions: Array<Array<Bundle>> = []
  editedPrescriptions.forEach(prescription => {
    if (prescription.nominatedOds) {
      const prescriptionToEdit = currentPrescriptions.find(entry => getMedicationRequestResources(entry)[0].groupIdentifier.value === prescription.prescriptionId)
      if (prescriptionToEdit) {
        const medicationRequests = getMedicationRequestResources(prescriptionToEdit)
        medicationRequests.forEach(medication => {
          const performer = medication.dispenseRequest?.performer
          if (performer) {
            performer.identifier.value = prescription.nominatedOds
          }
        })
        const multipleArray = createEmptyArrayOfSize(prescription.numberOfCopies)
          .fill(prescriptionToEdit)
          .map(entry => clone(entry))
        updatedPrescriptions.push(multipleArray)
      }
    }
  })

  const newPrescriptions = updatedPrescriptions.flat()
  newPrescriptions.forEach(prescription => updateBundleIds(prescription))

  await axiosInstance.post(`${baseUrl}prescribe/edit`, newPrescriptions)
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

import PrescriptionSummaryView, {createSummaryPrescriptionViewProps, PrescriptionSummaryErrors} from "../components/prescription-summary/prescriptionSummaryView"
import * as React from "react"
import {useContext, useState} from "react"
import {Bundle, OperationOutcome} from "fhir/r4"
import LongRunningTask from "../components/common/longRunningTask"
import {AppContext} from "../index"
import {ActionLink, Button, Form, Label} from "nhsuk-react-components"
import ButtonList from "../components/common/buttonList"
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

type SignPageFormErrors = PrescriptionSummaryErrors

const SignPage: React.FC<SignPageProps> = ({
  prescriptionId
}) => {
  const {baseUrl} = useContext(AppContext)
  const [editMode, setEditMode] = useState(false)
  const [sendPageFormValues, setSendPageFormValues] = useState<SignPageFormValues>({editedPrescriptions: []})
  const [currentPage, setCurrentPage] = useState(1)
  const retrievePrescriptionsTask = () => retrievePrescriptions(baseUrl)

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

  return (
    <LongRunningTask<Array<Bundle>> task={retrievePrescriptionsTask} loadingMessage="Retrieving prescription details.">
      {bundles => {
        if (sendPageFormValues.editedPrescriptions.length === 0) {
          const summaryViewProps = createSummaryPrescriptionViewProps(
            bundles[currentPage - 1],
            currentPage,
            parseInt(Object.keys(bundles).pop()) + 1,
            setCurrentPage,
            editMode,
            setEditMode
          )

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
                    <Button data-testid="signAndSendButton">Sign &amp; Send</Button>
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

async function retrievePrescriptions(baseUrl: string): Promise<Array<Bundle>> {
  return (await axiosInstance.get(`${baseUrl}prescriptions`)).data as Array<Bundle>
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

  const updatedPrescriptions: Array<Bundle> = []
  editedPrescriptions.forEach(prescription => {
    const prescriptionToEdit = currentPrescriptions.find(entry => getMedicationRequestResources(entry)[0].groupIdentifier.value === prescription.prescriptionId)
    if (prescriptionToEdit) {
      const medicationRequests = getMedicationRequestResources(prescriptionToEdit)
      medicationRequests.forEach(medication => {
        const performer = medication.dispenseRequest?.performer
        if (performer) {
          performer.identifier.value = prescription.nominatedOds
        }
      })

      updatedPrescriptions.push(prescriptionToEdit)

      const numberOfCopies = parseInt(prescription.numberOfCopies)
      for (let i = 1; i < numberOfCopies; i++) {
        const newCopy = clone(prescriptionToEdit)
        updateBundleIds(newCopy)
        updatedPrescriptions.push(newCopy)
      }
    }
  })

  await axiosInstance.post(`${baseUrl}prescribe/edit`, updatedPrescriptions)
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

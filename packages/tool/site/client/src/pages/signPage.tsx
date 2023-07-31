import {
  PrescriptionSummaryView,
  EditPrescriptionErrors,
  EditPrescriptionProps,
  createPrescriptionSummaryViewProps
} from "../components/prescription-summary"
import * as React from "react"
import {useContext, useState} from "react"
import {Bundle, OperationOutcome} from "fhir/r4"
import LongRunningTask from "../components/common/longRunningTask"
import {AppContext} from "../index"
import {ActionLink, Button, Form, Label} from "nhsuk-react-components"
import ButtonList from "../components/common/buttonList"
import {axiosInstance} from "../requests/axiosInstance"
import BackButton from "../components/common/backButton"
import {Formik, FormikErrors} from "formik"
import {getMedicationRequestResources} from "../fhir/bundleResourceFinder"
import {updateBundleIds} from "../fhir/helpers"
import {zip} from "../services/zip-files"
import {PaginationWrapper} from "../components/pagination"
import {sign} from "../requests/callCredentialManager/callCredentialManager"
import {start} from "../requests/callCredentialManager/helpers"
import AppendHead from "react-append-head"

interface EditPrescriptionValues {
  numberOfCopies: string
  nominatedOds: string
  prescriptionId: string
}

interface SignPageFormValues {
  editedPrescriptions: Array<EditPrescriptionValues>
}

type SignPageFormErrors = EditPrescriptionErrors

const SignPage: React.FC = () => {
  const {baseUrl} = useContext(AppContext)
  const [editMode, setEditMode] = useState(false)
  const [sendPageFormValues, setSendPageFormValues] = useState<SignPageFormValues>({editedPrescriptions: []})
  const [currentPage, setCurrentPage] = useState(1)
  const retrievePrescriptionsTask = () => retrievePrescriptions(baseUrl)

  // useEffect(() => {
  //   const prScript = document.createElement("script")
  //   const consumePrScript = document.createElement("script")
  //   const jqueryScript = document.createElement("script")
  //   jqueryScript.src = baseUrl + "static/jquery-3.1.1.min.js"
  //   prScript.src = baseUrl + "static/pr-service.js"
  //   consumePrScript.src = baseUrl + "static/consume-pr-service.js"
  //   document.head.appendChild(jqueryScript)
  //   document.head.appendChild(prScript)
  //   document.head.appendChild(consumePrScript)

  //   return () => {
  //     document.head.removeChild(jqueryScript)
  //     document.head.removeChild(prScript)
  //     document.head.removeChild(consumePrScript)
  //   }
  // }, [baseUrl])

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
        const currentBundle = bundles[currentPage - 1]
        if (sendPageFormValues.editedPrescriptions.length === 0) {
          const numberOfPages = parseInt(Object.keys(bundles).pop()) + 1
          const prescriptionSummaryViewProps = createPrescriptionSummaryViewProps(currentBundle)

          const initialValues = {
            numberOfCopies: "1",
            nominatedOds: prescriptionSummaryViewProps.prescriptionLevelDetails.nominatedOds,
            prescriptionId: prescriptionSummaryViewProps.prescriptionLevelDetails.prescriptionId
          }

          const getEditorProps = (formErrors: SignPageFormErrors): EditPrescriptionProps => {
            return {
              editMode,
              setEditMode,
              errors: formErrors
            }
          }

          const handlePrescriptionDownload = async () => {
            const prescriptionShortFormId = getMedicationRequestResources(currentBundle)[0].groupIdentifier.value

            const xmlConvertMessage = await axiosInstance.post<string>(`${baseUrl}api/convert`, currentBundle)

            await zip(prescriptionShortFormId, [
              {fileName: "fhir-message.json", data: JSON.stringify(currentBundle, null, 2)},
              {fileName: "hl7v3-message.xml", data: xmlConvertMessage.data}
            ])
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

                  <PaginationWrapper currentPage={currentPage} totalCount={numberOfPages} onPageChange={setCurrentPage}>
                    <PrescriptionSummaryView
                      {...prescriptionSummaryViewProps}
                      editorProps={getEditorProps(errors)}
                      handleDownload={handlePrescriptionDownload} />
                  </PaginationWrapper>

                  <ButtonList>
                    <Button>Sign &amp; Send</Button>
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
            {signResponse => {
              return (
                <>
                  <AppendHead>
                    <script type="text/javascript" src="/eps-api-tool-pr-1527/static/jquery-3.1.1.min.js"></script>
                    <script type="text/javascript" src="/eps-api-tool-pr-1527/static/pr-service.js"></script>
                    <script type="text/javascript" src="/eps-api-tool-pr-1527/static/consume-pr-service.js"></script>
                    <script defer src="/eps-api-tool-pr-1527/static/callCredentialManager.js"></script>
                  </AppendHead>
                  <Label isPageHeading>Upload Complete</Label>
                  <Label>Use the link below if you are not redirected automatically.</Label>
                  <ActionLink href={signResponse.redirectUri}>Proceed to the Signing Service</ActionLink>
                </>
              )
            }}
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
  //Return the payload and send it back in the response, WITHOUT sending to signing service.
  const response = await axiosInstance.post<string>(`${baseUrl}sign/upload-signatures`)
  //console.log("Response: " + JSON.stringify(response.data))
  //Then use the same code as signing-service repo signalR.ts example to call credentialManagement, wait for all content to load
  window.addEventListener("DOMContentLoaded", () => {
    start(response.data, sign)
  })
  const signResponse = {} as SignResponse
  signResponse.redirectUri = "https://example.com/"
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

interface SignResponse {
  redirectUri?: string
  prepareErrors?: Array<OperationOutcome>
}

export default SignPage

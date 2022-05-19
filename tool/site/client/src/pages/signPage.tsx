import PrescriptionSummaryView, {createSummaryPrescriptionViewProps, PrescriptionSummaryErrors} from "../components/prescription-summary/prescriptionSummaryView"
import * as React from "react"
import {useContext, useState} from "react"
import {Bundle, BundleEntry, OperationOutcome, Patient} from "fhir/r4"
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
import {isOperationOutcome} from "../fhir/typeGuards"

export interface EditPrescriptionValues {
  prescriptionId: string
  numberOfCopies: string
  nominatedOds: string
  nhsNumber: string
  nominateToPatientsPharmcy: boolean
}

export interface SignFormValues {
  editedPrescriptions: Array<EditPrescriptionValues>
}

type SignFormErrors = PrescriptionSummaryErrors

const SignPage: React.FC = () => {
  const {baseUrl} = useContext(AppContext)
  const [editMode, setEditMode] = useState(false)
  const [prescriptions, setPrescriptions] = useState<Array<Bundle>>([])
  const [signFormValues, setSignFormValues] = useState<SignFormValues>({editedPrescriptions: []})
  const [currentPage, setCurrentPage] = useState(1)
  const retrievePrescriptionsTask = () => retrievePrescriptions(baseUrl, setPrescriptions)

  const validate = (values: EditPrescriptionValues) => {
    const errors: FormikErrors<SignFormErrors> = {}

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
        if (signFormValues.editedPrescriptions.length === 0) {

          const pagination = {
            currentPage,
            pageCount: parseInt(Object.keys(bundles).pop()) + 1,
            onPageChange: setCurrentPage
          }
          const edits = {
            editMode,
            setEditMode,
            editPrescription
          }

          const summaryViewProps = createSummaryPrescriptionViewProps(
            prescriptions,
            setPrescriptions,
            pagination,
            edits
          )

          const updateEditedPrescription = (editValues: EditPrescriptionValues): void => {
            const previouslyEdited = signFormValues.editedPrescriptions
            if (previouslyEdited.every(prescription => prescription.prescriptionId !== editValues.prescriptionId)) {
              previouslyEdited.push(editValues)
            }
            setSignFormValues({editedPrescriptions: previouslyEdited})
          }

          return (
            <Formik<EditPrescriptionValues>
              initialValues={summaryViewProps.editValues}
              onSubmit={updateEditedPrescription}
              validate={validate}
              validateOnBlur={false}
              validateOnChange={false}
            >
              {({handleSubmit, handleReset, values, errors}) =>
                <Form onSubmit={handleSubmit} onReset={handleReset}>
                  <PrescriptionSummaryView {...summaryViewProps} editValues={values} edits={edits} errors={errors} />
                  <ButtonList>
                    <Button>Sign &amp; Send</Button>
                    <BackButton/>
                  </ButtonList>
                </Form>
              }
            </Formik>
          )
        }

        const sendSignatureUploadTask = () => sendSignatureUploadRequest(prescriptions, signFormValues, setPrescriptions, setEditMode, baseUrl)
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

async function retrievePrescriptions(baseUrl: string, setPrescriptions: React.Dispatch<React.SetStateAction<Array<Bundle>>>): Promise<Array<Bundle>> {
  const prescriptions = (await axiosInstance.get(`${baseUrl}prescriptions`)).data as Array<Bundle>
  setPrescriptions(prescriptions)
  return prescriptions
}

async function sendSignatureUploadRequest(
  prescriptions: Array<Bundle>,
  signFormValues: SignFormValues,
  setPrescriptions: React.Dispatch<React.SetStateAction<Array<Bundle>>>,
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>,
  baseUrl: string
) {
  await updateEditedPrescriptions(prescriptions, signFormValues, setPrescriptions, setEditMode, baseUrl)
  const response = await axiosInstance.post<SignResponse>(`${baseUrl}sign/upload-signatures`)
  const signResponse = getResponseDataIfValid(response, isSignResponse)
  redirect(signResponse.redirectUri)
  return signResponse
}

async function updateEditedPrescriptions(
  prescriptions: Array<Bundle>,
  signFormValues: SignFormValues,
  setPrescriptions: React.Dispatch<React.SetStateAction<Array<Bundle>>>,
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>,
  baseUrl: string
) {
  const {editedPrescriptions} = signFormValues

  const updatedPrescriptions: Array<Bundle> = []
  for (const editValues of editedPrescriptions) {
    const prescriptionToEdit = prescriptions.find(entry => getMedicationRequestResources(entry)[0].groupIdentifier.value === editValues.prescriptionId)
    if (prescriptionToEdit) {
      await editPrescription(baseUrl, prescriptions, prescriptionToEdit, editValues, setPrescriptions, setEditMode)

      updatedPrescriptions.push(prescriptionToEdit)

      const numberOfCopies = parseInt(editValues.numberOfCopies)
      for (let i = 1; i < numberOfCopies; i++) {
        const newCopy = clone(prescriptionToEdit)
        updateBundleIds(newCopy)
        updatedPrescriptions.push(newCopy)
      }
    }
  }

  await axiosInstance.post(`${baseUrl}prescribe/edit`, updatedPrescriptions)
}

interface PdsResponse {
  success: boolean
  response: Patient | OperationOutcome
}

async function editPrescription(
  baseUrl: string,
  prescriptions: Array<Bundle>,
  prescriptionToEdit: Bundle,
  editValues: EditPrescriptionValues,
  setPrescriptions: React.Dispatch<React.SetStateAction<Array<Bundle>>>,
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>
) {
  const patientBundleEntry: BundleEntry = prescriptionToEdit.entry.find(p => p.resource.resourceType === "Patient")
  const patient = patientBundleEntry.resource as Patient
  const nhsNumber = patient.identifier.find(i => i.system === "https://fhir.nhs.uk/Id/nhs-number").value
  if (nhsNumber !== editValues.nhsNumber) {
    const pdsPatientResponse = (await axiosInstance.get<PdsResponse>(`${baseUrl}api/patient/${nhsNumber}`)).data
    if (isOperationOutcome(pdsPatientResponse.response)) {
      console.log(`Failed to retrieve patient ${nhsNumber} from PDS.`)
    } else {
      const newPatient = pdsPatientResponse.response

      // PDS <-> EPS misalignment
      // 1# None of the codings provided are in the value set https://fhir.hl7.org.uk/ValueSet/UKCore-NHSNumberVerificationStatus
      newPatient.identifier[0].extension = []
      // 2# The extension https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-OtherContactSystem is not allowed to be used at this point
      newPatient.telecom = newPatient.telecom.map(t => {
        t.extension = []
        return t
      })

      patientBundleEntry.resource = {
        ...patientBundleEntry.resource,
        ...newPatient
      } as Patient
    }
  }

  const nominatedOds = editValues.nominateToPatientsPharmcy
    ? (patientBundleEntry.resource as Patient)
      .extension?.find(e => e.url === "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-NominatedPharmacy")
      ?.valueReference.identifier.value ?? editValues.nominatedOds
    : editValues.nominatedOds

  const medicationRequests = getMedicationRequestResources(prescriptionToEdit)
  medicationRequests.forEach(medication => {
    const performer = medication.dispenseRequest?.performer
    if (performer) {
      performer.identifier.value = nominatedOds
    }
  })

  const existingPrescriptionIndex = prescriptions.findIndex(bundle => {
    return bundle.id === prescriptionToEdit.id
  })
  prescriptions[existingPrescriptionIndex] = prescriptionToEdit

  setPrescriptions(prescriptions)
  setEditMode(false)
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

import React, {useContext} from "react"
import * as fhir from "fhir/r4"
import PatientSummaryList, {createSummaryPatient, SummaryPatient} from "./patientSummaryList"
import PractitionerRoleSummaryList, {
  createSummaryPractitionerRole,
  SummaryPractitionerRole
} from "./practitionerRoleSummaryList"
import {Button, Images, Input, Label} from "nhsuk-react-components"
import Pagination from "../pagination"
import MedicationSummary, {createSummaryMedication, SummaryMedication} from "./medicationSummary"
import PrescriptionLevelDetails, {
  createPrescriptionLevelDetails,
  PrescriptionLevelDetailsProps
} from "./prescriptionLevelDetails"
import styled from "styled-components"
import {AppContext} from "../.."
import {Field} from "formik"
import ButtonList from "../common/buttonList"
import * as common from "../../models/common"

export interface PrescriptionSummaryViewProps {
  medications: Array<SummaryMedication>
  patient: SummaryPatient
  practitionerRole: SummaryPractitionerRole
  prescriptionLevelDetails: PrescriptionLevelDetailsProps
  currentPage: number
  pageCount: number
  onPageChange: (page: number) => void
  editMode: boolean
  setEditMode: (value: React.SetStateAction<boolean>) => void
  errors: PrescriptionSummaryErrors
  handleDownload?: () => Promise<void>
}

export interface PrescriptionSummaryErrors {
  numberOfCopies?: string
}

const StyledImages = styled(Images)`
  width: 50px;
  margin-left: 25px;
  float: right;
  margin-top: -50px;
`

const PrescriptionSummaryView: React.FC<PrescriptionSummaryViewProps> = ({
  medications,
  patient,
  practitionerRole,
  prescriptionLevelDetails,
  currentPage,
  pageCount,
  onPageChange,
  editMode,
  setEditMode,
  errors,
  handleDownload
}) => {
  const {baseUrl} = useContext(AppContext)

  return (
    <>
      <Label isPageHeading>
        <span>Prescription Summary</span>
        {!editMode
          ? <StyledImages
            id="editPrescription"
            onClick={() => setEditMode(true)}
            srcSet={`${baseUrl}static/BlackTie_Bold_full_set_Pencil_SVG_Blue.svg`}
            sizes="50px"
          />
          : <div style={{float: "right", width: "300px"}}>
            <Label>How many copies do you want?</Label>
            <Field
              id="numberOfCopies"
              name="numberOfCopies"
              as={Input}
              width={500}
              error={errors.numberOfCopies}
            />
          </div>
        }
      </Label>
      <Pagination
        currentPage={currentPage}
        totalCount={pageCount}
        pageSize={1}
        onPageChange={onPageChange} />
      {handleDownload && <ButtonList>
        <Button onClick={() => handleDownload()} type={"button"}>Download this Prescription</Button>
      </ButtonList>}
      <PrescriptionLevelDetails {...prescriptionLevelDetails} editMode={editMode}/>
      <Label size="m" bold>Patient</Label>
      <PatientSummaryList {...patient}/>
      <MedicationSummary medicationSummaryList={medications}/>
      <Label size="m" bold>Prescriber</Label>
      <PractitionerRoleSummaryList {...practitionerRole}/>
      <Pagination
        currentPage={currentPage}
        totalCount={pageCount}
        pageSize={1}
        onPageChange={onPageChange} />
    </>
  )
}

export function createSummaryPrescriptionViewProps(
  bundle: fhir.Bundle,
  prescription: common.Prescription,
  currentPage: number,
  pageCount: number,
  onPageChange: (page: number) => void,
  editMode: boolean,
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>
): PrescriptionSummaryViewProps {
  const resources = bundle.entry.map(e => e.resource)
  const medicationRequests = resources.filter(r => r.resourceType === "MedicationRequest") as Array<fhir.MedicationRequest>
  const summaryMedicationRequests = medicationRequests.map(createSummaryMedication)

  const communicationRequests = resources.filter(r => r.resourceType === "CommunicationRequest") as Array<fhir.CommunicationRequest>
  const medicationRequest = medicationRequests[0]

  const prescriptionLevelDetails = createPrescriptionLevelDetails(editMode, prescription, medicationRequest, communicationRequests)

  const patient: fhir.Patient = resolveReference(bundle, medicationRequest.subject)

  const requesterPractitionerRole: fhir.PractitionerRole = resolveReference(bundle, medicationRequest.requester)
  const requesterPractitioner: fhir.Practitioner = resolveReference(bundle, requesterPractitionerRole.practitioner)
  const requesterOrganization: fhir.Organization = resolveReference(bundle, requesterPractitionerRole.organization)
  const requesterHealthcareService: fhir.HealthcareService = requesterPractitionerRole.healthcareService
    ? resolveReference(bundle, requesterPractitionerRole.healthcareService[0])
    : undefined
  const requesterLocation: fhir.Location = resolveReference(bundle, requesterHealthcareService?.location[0])

  const summaryPatient = createSummaryPatient(patient)

  const summaryPractitionerRole = createSummaryPractitionerRole(
    requesterPractitionerRole,
    requesterPractitioner,
    requesterOrganization,
    requesterHealthcareService,
    requesterLocation
  )

  return {
    medications: summaryMedicationRequests,
    patient: summaryPatient,
    practitionerRole: summaryPractitionerRole,
    prescriptionLevelDetails,
    currentPage,
    pageCount,
    onPageChange,
    editMode,
    setEditMode,
    errors: {}
  }
}

function resolveReference<T extends fhir.FhirResource>(bundle: fhir.Bundle, reference: fhir.Reference) {
  return bundle.entry.find(e => e.fullUrl === reference?.reference)?.resource as T
}

export default PrescriptionSummaryView

import React, {useContext} from "react"
import * as fhir from "fhir/r4"
import PatientSummaryList, {createSummaryPatientListProps, PatientSummaryListProps} from "./patientSummaryList"
import PractitionerRoleSummaryList, {
  createSummaryPractitionerRole,
  SummaryPractitionerRole
} from "./practitionerRoleSummaryList"
import {Images, Input, Label} from "nhsuk-react-components"
import Pagination from "../../components/pagination"
import MedicationSummary, {createSummaryMedication, SummaryMedication} from "./medicationSummary"
import PrescriptionLevelDetails, {
  createPrescriptionLevelDetails,
  PrescriptionLevelDetailsProps
} from "./prescriptionLevelDetails"
import styled from "styled-components"
import {AppContext} from "../.."
import {Field} from "formik"
import {EditPrescriptionValues} from "../../pages/signPage"
import {Bundle} from "fhir/r4"

export interface PrescriptionSummaryViewProps {
  prescriptions: Array<Bundle>
  setPrescriptions: React.Dispatch<React.SetStateAction<Array<Bundle>>>
  editValues: EditPrescriptionValues
  medications: Array<SummaryMedication>
  patient: PatientSummaryListProps
  practitionerRole: SummaryPractitionerRole
  prescriptionLevelDetails: PrescriptionLevelDetailsProps
  pagination: Pagination
  edits: Edits
  errors: PrescriptionSummaryErrors
}

interface Pagination {
  currentPage: number
  pageCount: number
  onPageChange: React.Dispatch<React.SetStateAction<number>>
}

interface Edits {
  editMode: boolean
  setEditMode: (value: React.SetStateAction<boolean>) => void
  editPrescription: (prescriptions: Array<Bundle>,
    prescriptionToEdit: Bundle,
    editValues: EditPrescriptionValues,
    setPrescriptions: React.Dispatch<React.SetStateAction<Array<Bundle>>>,
    setEditMode: React.Dispatch<React.SetStateAction<boolean>>
  ) => Promise<void>
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
  prescriptions,
  setPrescriptions,
  medications,
  patient,
  practitionerRole,
  prescriptionLevelDetails,
  pagination,
  editValues,
  edits,
  errors
}) => {
  const {baseUrl} = useContext(AppContext)

  return (
    <>
      <Label isPageHeading>
        <span>Prescription Summary</span>
        {!edits.editMode
          ? <StyledImages
            id="editPrescription"
            onClick={() => edits.setEditMode(true)}
            srcSet={`${baseUrl}static/BlackTie_Bold_full_set_Pencil_SVG_Blue.svg`}
            sizes="50px"
          />
          : <>
            <div style={{float: "right", width: "300px"}}>
              <StyledImages
                id="editPrescription"
                onClick={() => edits.editPrescription(
                  prescriptions,
                  prescriptions[pagination.currentPage - 1],
                  editValues,
                  setPrescriptions,
                  edits.setEditMode
                )}
                srcSet={`${baseUrl}static/BlackTie_Bold_full_set_white_Tick_square_SVG_Blue.svg`}
                sizes="50px"
                style={{"marginTop": "inherit"}}
              />
              <Label>How many copies do you want?</Label>
              <Field
                id="numberOfCopies"
                name="numberOfCopies"
                as={Input}
                width={1}
                error={errors.numberOfCopies}
              />
            </div>
          </>
        }
      </Label>
      <Pagination
        currentPage={pagination.currentPage}
        totalCount={pagination.pageCount}
        pageSize={1}
        onPageChange={pagination.onPageChange} />
      <PrescriptionLevelDetails {...prescriptionLevelDetails} editMode={edits.editMode}/>
      <Label size="m" bold>Patient</Label>
      <PatientSummaryList {...patient} editMode={edits.editMode} />
      <MedicationSummary medicationSummaryList={medications}/>
      <Label size="m" bold>Prescriber</Label>
      <PractitionerRoleSummaryList {...practitionerRole}/>
      <Pagination
        currentPage={pagination.currentPage}
        totalCount={pagination.pageCount}
        pageSize={1}
        onPageChange={pagination.onPageChange} />
    </>
  )
}

export function createSummaryPrescriptionViewProps(
  prescriptions: Array<fhir.Bundle>,
  setPrescriptions: React.Dispatch<React.SetStateAction<Array<Bundle>>>,
  pagination: Pagination,
  edits: Edits
): PrescriptionSummaryViewProps {
  const bundle = prescriptions[pagination.currentPage - 1]
  const resources = bundle.entry.map(e => e.resource)
  const medicationRequests = resources.filter(r => r.resourceType === "MedicationRequest") as Array<fhir.MedicationRequest>
  const summaryMedicationRequests = medicationRequests.map(createSummaryMedication)

  const communicationRequests = resources.filter(r => r.resourceType === "CommunicationRequest") as Array<fhir.CommunicationRequest>
  const medicationRequest = medicationRequests[0]

  const prescriptionLevelDetails = createPrescriptionLevelDetails(edits.editMode, medicationRequest, communicationRequests)

  const patient: fhir.Patient = resolveReference(bundle, medicationRequest.subject)

  const requesterPractitionerRole: fhir.PractitionerRole = resolveReference(bundle, medicationRequest.requester)
  const requesterPractitioner: fhir.Practitioner = resolveReference(bundle, requesterPractitionerRole.practitioner)
  const requesterOrganization: fhir.Organization = resolveReference(bundle, requesterPractitionerRole.organization)
  const requesterHealthcareService: fhir.HealthcareService = requesterPractitionerRole.healthcareService
    ? resolveReference(bundle, requesterPractitionerRole.healthcareService[0])
    : undefined
  const requesterLocation: fhir.Location = resolveReference(bundle, requesterHealthcareService?.location[0])

  const summaryPatient = createSummaryPatientListProps(patient, edits.editMode)

  const summaryPractitionerRole = createSummaryPractitionerRole(
    requesterPractitionerRole,
    requesterPractitioner,
    requesterOrganization,
    requesterHealthcareService,
    requesterLocation
  )

  return {
    prescriptions: prescriptions,
    setPrescriptions: setPrescriptions,
    editValues: {
      numberOfCopies: "1",
      nominatedOds: prescriptionLevelDetails.nominatedOds,
      prescriptionId: prescriptionLevelDetails.prescriptionId,
      nhsNumber: summaryPatient.nhsNumber.replace(/ /g, ""),
      nominateToPatientsPharmcy: true
    },
    medications: summaryMedicationRequests,
    patient: summaryPatient,
    practitionerRole: summaryPractitionerRole,
    prescriptionLevelDetails,
    pagination,
    edits,
    errors: {}
  }
}

function resolveReference<T extends fhir.FhirResource>(bundle: fhir.Bundle, reference: fhir.Reference) {
  return bundle.entry.find(e => e.fullUrl === reference?.reference)?.resource as T
}

export default PrescriptionSummaryView

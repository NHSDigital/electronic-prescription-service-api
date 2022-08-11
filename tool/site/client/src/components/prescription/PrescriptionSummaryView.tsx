import * as fhir from "fhir/r4"
import {Button, Label} from "nhsuk-react-components"
import React from "react"

import ButtonList from "../common/buttonList"
import Pagination from "../pagination"

import {SummaryPatient} from "../prescription-summary/patientSummaryList"
import {SummaryMedication} from "./MedicationSummaryTable"
import {SummaryPractitionerRole} from "./PractitionerRoleSummaryList"
import {PrescriptionLevelDetails, PrescriptionLevelDetailsProps} from "./PrescriptionLevelDetails"
import {PrescriptionSummary} from "./PrescriptionSummary"
import {PrescriptionEditButton} from "./PrescriptionEditButton"

import {
  createPrescriptionLevelDetails,
  createSummaryMedication,
  createSummaryPatient,
  createSummaryPractitionerRole
} from "./utils"

interface PrescriptionSummaryViewProps {
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

interface PrescriptionSummaryErrors {
  numberOfCopies?: string
}

const PrescriptionSummaryView = ({
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
}: PrescriptionSummaryViewProps) => {
  return (
    <>
      <Label isPageHeading>
        <span>Prescription Summary</span>
        <PrescriptionEditButton editMode={editMode} setEditMode={setEditMode} errors={errors} />
      </Label>

      <Pagination
        currentPage={currentPage}
        totalCount={pageCount}
        pageSize={1}
        onPageChange={onPageChange} />

      {handleDownload && <ButtonList>
        <Button onClick={() => handleDownload()} type={"button"}>Download this Prescription</Button>
      </ButtonList>}

      <PrescriptionLevelDetails {...prescriptionLevelDetails} editMode={editMode} />
      <PrescriptionSummary medications={medications} patient={patient} practitionerRole={practitionerRole} />

      <Pagination
        currentPage={currentPage}
        totalCount={pageCount}
        pageSize={1}
        onPageChange={onPageChange} />
    </>
  )
}

function createSummaryPrescriptionViewProps(
  bundle: fhir.Bundle,
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

  const prescriptionLevelDetails = createPrescriptionLevelDetails(editMode, medicationRequest, communicationRequests)

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

export {
  PrescriptionSummaryView,
  PrescriptionSummaryViewProps,
  PrescriptionSummaryErrors,
  createSummaryPrescriptionViewProps
}

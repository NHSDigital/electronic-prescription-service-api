import * as React from "react"
import * as fhir from "fhir/r4"
import PatientSummaryList, {
  createSummaryPatient,
  SummaryPatient
} from "./patientSummaryList"
import PractitionerRoleSummaryList, {
  createSummaryPractitionerRole,
  SummaryPractitionerRole
} from "./practitionerRoleSummaryList"
import {Label} from "nhsuk-react-components"
import {ErrorBoundary} from "../errorBoundary"

export function createSummaryPrescription(bundle: fhir.Bundle): SummaryPrescription {
  const resources = bundle.entry.map(e => e.resource)
  const medicationRequests = resources.filter(r => r.resourceType === "MedicationRequest") as Array<fhir.MedicationRequest>
  const medicationRequest = medicationRequests[0]

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
    patient: summaryPatient,
    practitionerRole: summaryPractitionerRole
  }
}

export interface SummaryPrescription {
  patient: SummaryPatient
  practitionerRole: SummaryPractitionerRole
}

const PrescriptionSummaryView: React.FC<SummaryPrescription> = ({
  patient,
  practitionerRole
}) => {
  return (
    <>
      <Label isPageHeading>Prescription Summary</Label>
      <Label size="m" bold>Patient</Label>
      <ErrorBoundary>
        <PatientSummaryList {...patient}/>
      </ErrorBoundary>
      <Label size="m" bold>Prescriber</Label>
      <ErrorBoundary>
        <PractitionerRoleSummaryList {...practitionerRole}/>
      </ErrorBoundary>
    </>
  )
}

function resolveReference<T extends fhir.FhirResource>(bundle: fhir.Bundle, reference: fhir.Reference) {
  return bundle.entry.find(e => e.fullUrl === reference?.reference)?.resource as T
}

export default PrescriptionSummaryView

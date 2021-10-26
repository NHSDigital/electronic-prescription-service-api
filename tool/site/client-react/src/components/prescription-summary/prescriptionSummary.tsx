import * as React from "react"
import {
  Bundle,
  FhirResource,
  HealthcareService,
  Location,
  MedicationRequest,
  Organization,
  Patient,
  Practitioner,
  PractitionerRole,
  Reference
} from "fhir/r4"
import {PatientSummaryList} from "./patientSummaryList"
import {PractitionerRoleSummaryList} from "./practitionerRoleSummaryList"
import {Label} from "nhsuk-react-components"
import {ErrorBoundary} from "../errorBoundary"

interface PrescriptionSummaryProps {
  bundle: Bundle
}

export const PrescriptionSummary = ({bundle}: PrescriptionSummaryProps): JSX.Element => {
  const resources = bundle.entry.map(e => e.resource)
  const medicationRequests = resources.filter(r => r.resourceType === "MedicationRequest") as Array<MedicationRequest>
  const medicationRequest = medicationRequests[0]

  const patient: Patient = resolveReference(bundle, medicationRequest.subject)

  const requesterPractitionerRole: PractitionerRole = resolveReference(bundle, medicationRequest.requester)
  const requesterPractitioner: Practitioner = resolveReference(bundle, requesterPractitionerRole.practitioner)
  const requesterOrganization: Organization = resolveReference(bundle, requesterPractitionerRole.organization)
  const requesterHealthcareService: HealthcareService = resolveReference(bundle, requesterPractitionerRole.healthcareService[0])
  const requesterLocation: Location = resolveReference(bundle, requesterHealthcareService?.location[0])

  return (
    <>
      <Label isPageHeading>Prescription Summary</Label>
      <Label size="m" bold>Patient</Label>
      <ErrorBoundary>
        <PatientSummaryList patient={patient}/>
      </ErrorBoundary>
      <Label size="m" bold>Prescriber</Label>
      <ErrorBoundary>
        <PractitionerRoleSummaryList
          practitionerRole={requesterPractitionerRole}
          practitioner={requesterPractitioner}
          organization={requesterOrganization}
          healthcareService={requesterHealthcareService}
          location={requesterLocation}
        />
      </ErrorBoundary>
    </>
  )
}

function resolveReference<T extends FhirResource>(bundle: Bundle, reference: Reference) {
  return bundle.entry.find(e => e.fullUrl === reference?.reference)?.resource as T
}

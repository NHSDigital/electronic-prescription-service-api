import * as React from "react"
import * as fhir from "fhir/r4"
import {createPatientSummaryListProps, PatientSummaryList, PatientSummaryListProps} from "./patientSummaryList"
import {
  createPractitionerRoleSummaryListProps,
  PractitionerRoleSummaryList,
  PractitionerRoleSummaryListProps
} from "./practitionerRoleSummaryList"
import {Label} from "nhsuk-react-components"
import {ErrorBoundary} from "../errorBoundary"

export function createPrescriptionSummaryProps(bundle: fhir.Bundle): PrescriptionSummaryProps {
  const resources = bundle.entry.map(e => e.resource)
  const medicationRequests = resources.filter(r => r.resourceType === "MedicationRequest") as Array<fhir.MedicationRequest>
  const medicationRequest = medicationRequests[0]

  const patient: fhir.Patient = resolveReference(bundle, medicationRequest.subject)

  const requesterPractitionerRole: fhir.PractitionerRole = resolveReference(bundle, medicationRequest.requester)
  const requesterPractitioner: fhir.Practitioner = resolveReference(bundle, requesterPractitionerRole.practitioner)
  const requesterOrganization: fhir.Organization = resolveReference(bundle, requesterPractitionerRole.organization)
  const requesterHealthcareService: fhir.HealthcareService = requesterPractitionerRole.healthcareService ? resolveReference(bundle, requesterPractitionerRole.healthcareService[0]) : undefined
  const requesterLocation: fhir.Location = resolveReference(bundle, requesterHealthcareService?.location[0])

  const patientSummaryListProps = createPatientSummaryListProps(patient)

  const practitionerRoleSummaryListProps = createPractitionerRoleSummaryListProps(
    requesterPractitionerRole,
    requesterPractitioner,
    requesterOrganization,
    requesterHealthcareService,
    requesterLocation
  )

  return {
    patient: patientSummaryListProps,
    practitionerRole: practitionerRoleSummaryListProps
  }
}

interface PrescriptionSummaryProps {
  patient: PatientSummaryListProps
  practitionerRole: PractitionerRoleSummaryListProps
}

export const PrescriptionSummary = ({
  patient,
  practitionerRole
}: PrescriptionSummaryProps): JSX.Element => {
  return (
    <>
      <Label isPageHeading>Prescription Summary</Label>
      <Label size="m" bold>Patient</Label>
      <ErrorBoundary>
        <PatientSummaryList
          name={patient.name}
          nhsNumber={patient.nhsNumber}
          dateOfBirth={patient.dateOfBirth}
          gender={patient.gender}
          addressLines={patient.addressLines}
        />
      </ErrorBoundary>
      <Label size="m" bold>Prescriber</Label>
      <ErrorBoundary>
        <PractitionerRoleSummaryList
          name={practitionerRole.name}
          telecom={practitionerRole.telecom}
          organization={practitionerRole.organization}
          parentOrganization={practitionerRole.parentOrganization}
        />
      </ErrorBoundary>
    </>
  )
}

function resolveReference<T extends fhir.FhirResource>(bundle: fhir.Bundle, reference: fhir.Reference) {
  return bundle.entry.find(e => e.fullUrl === reference?.reference)?.resource as T
}

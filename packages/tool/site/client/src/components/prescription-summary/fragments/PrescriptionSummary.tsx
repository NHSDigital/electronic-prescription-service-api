import React from "react"
import fhir from "fhir/r4"
import {PatientSummaryList, SummaryPatient} from "./PatientSummaryList"
import {PractitionerRoleSummaryList, SummaryPractitionerRole} from "./PractitionerRoleSummaryList"
import {Label} from "nhsuk-react-components"
import {MedicationSummaryTable, SummaryMedication} from "./MedicationSummaryTable"

import {
  createSummaryMedication,
  createSummaryPatient,
  createSummaryPractitionerRole
} from "./utils"
import RadioField from "../../common/radioField"

interface PrescriptionSummaryProps {
  medications: Array<SummaryMedication>
  patient: SummaryPatient
  practitionerRole: SummaryPractitionerRole
}

const PrescriptionSummary = ({medications, patient, practitionerRole}: PrescriptionSummaryProps) => {
  return (
    <>
      <Label size="m" bold>Patient</Label>
      <PatientSummaryList {...patient} />
      <MedicationSummaryTable medicationSummaryList={medications} />
      <Label size="m" bold>Prescriber</Label>
      <PractitionerRoleSummaryList {...practitionerRole} />
      <RadioField
        name="signingOptions"
        label="Choose a sign in option"
        defaultValue="N3_SMARTCARD"
        fieldRadios={remoteSigningOptions}
      />
    </>
  )
}

const createPrescriptionSummary = (
  bundle: fhir.Bundle,
  medicationRequests: Array<fhir.MedicationRequest>
): PrescriptionSummaryProps => {
  // TODO: use common utils from 'coordinator'
  const summaryMedicationRequests = medicationRequests.map(createSummaryMedication)

  const medicationRequest = medicationRequests[0]

  const patient: fhir.Patient = resolveReference(bundle, medicationRequest.subject)
  const summaryPatient = createSummaryPatient(patient)

  const requesterPractitionerRole: fhir.PractitionerRole = resolveReference(bundle, medicationRequest.requester)
  const requesterPractitioner: fhir.Practitioner = resolveReference(bundle, requesterPractitionerRole.practitioner)
  const requesterOrganization: fhir.Organization = resolveReference(bundle, requesterPractitionerRole.organization)
  const requesterHealthcareService: fhir.HealthcareService = requesterPractitionerRole.healthcareService
    ? resolveReference(bundle, requesterPractitionerRole.healthcareService[0])
    : undefined
  const requesterLocation: fhir.Location = resolveReference(bundle, requesterHealthcareService?.location[0])

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
    practitionerRole: summaryPractitionerRole}
}

function resolveReference<T extends fhir.FhirResource>(bundle: fhir.Bundle, reference: fhir.Reference) {
  return bundle.entry.find(e => e.fullUrl === reference?.reference)?.resource as T
}

export {
  PrescriptionSummary,
  PrescriptionSummaryProps,
  createPrescriptionSummary
}

export const remoteSigningOptions = [
  {
    value:"N3_SMARTCARD",
    text: "N3 Smartcard"
  },
  {
    value:"IOS",
    text: "IOS"
  },
  {
    value:"FIDO2",
    text: "FIDO2"
  }
].map((signingOptions, index) => ({...signingOptions, id: index}))

import React, { useContext } from "react"
import * as fhir from "fhir/r4"
import {PatientSummaryList, createSummaryPatient, SummaryPatient } from "./PatientSummaryList"
import {PractitionerRoleSummaryList, SummaryPractitionerRole} from "./PractitionerRoleSummaryList"
import { Label } from "nhsuk-react-components"
import {MedicationSummaryTable, createSummaryMedication, SummaryMedication } from "./MedicationSummaryTable"


interface PrescriptionSummaryProps {
  medications: Array<SummaryMedication>
  patient: SummaryPatient
  practitionerRole: SummaryPractitionerRole
}

const PrescriptionSummary = ({ medications, patient, practitionerRole }: PrescriptionSummaryProps) => {
  return (
    <>
      <Label size="m" bold>Patient</Label>
      <PatientSummaryList {...patient} />
      <MedicationSummaryTable medicationSummaryList={medications} />
      <Label size="m" bold>Prescriber</Label>
      <PractitionerRoleSummaryList {...practitionerRole} />
    </>
  )
}

export {
  PrescriptionSummary
}

import React from "react"
import {PatientSummaryList, SummaryPatient} from "./PatientSummaryList"
import {PractitionerRoleSummaryList, SummaryPractitionerRole} from "./PractitionerRoleSummaryList"
import {Label} from "nhsuk-react-components"
import {MedicationSummaryTable, SummaryMedication} from "./MedicationSummaryTable"

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
    </>
  )
}

export {
  PrescriptionSummary
}

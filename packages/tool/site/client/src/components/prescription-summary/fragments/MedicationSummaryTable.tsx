import * as React from "react"
import {MedicationRequest} from "fhir/r4"
import {Table} from "nhsuk-react-components"
import {
  getControlledDrugExtensions,
  getPrescriptionEndorsementExtensions,
  getScheduleExtensions
} from "../../../fhir/customExtensions"
import {SHA1} from "crypto-js"

interface SummaryMedication {
  id?: number,
  controlledDrugSchedule?: string,
  dispenserNotes?: Array<string>
  dosageInstruction?: Array<string>
  prescriptionEndorsements?: Array<string>
  quantityUnit: string
  quantityValue: number
  snomedCodeDescription: string
}

interface MedicationSummaryProps {
  medicationSummaryList: Array<SummaryMedication>
}

const MedicationSummaryTable: React.FC<MedicationSummaryProps> = ({medicationSummaryList}) => {
  const prescriptionHasControlledDrug = medicationSummaryList.some(medication => medication.controlledDrugSchedule)
  return (
    <Table.Panel heading="Medication">
      <Table caption="Medication summary">
        <Table.Head>
          <Table.Row>
            <Table.Cell>Details</Table.Cell>
            <Table.Cell>Quantity</Table.Cell>
            <Table.Cell>Unit</Table.Cell>
            <Table.Cell>Dosage Instructions</Table.Cell>
            {prescriptionHasControlledDrug && <Table.Cell>Controlled Drug</Table.Cell>}
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {medicationSummaryList.map(medication => <MedicationRow
            key={medication.id}
            prescriptionHasControlledDrug={prescriptionHasControlledDrug}
            {...medication}
          />)}
        </Table.Body>
      </Table>
    </Table.Panel>
  )
}

interface MedicationRowProps extends SummaryMedication {
  prescriptionHasControlledDrug: boolean
}

const MedicationRow = ({
  controlledDrugSchedule,
  dispenserNotes,
  dosageInstruction,
  prescriptionEndorsements,
  prescriptionHasControlledDrug,
  quantityUnit,
  quantityValue,
  snomedCodeDescription
}: MedicationRowProps) => {
  return (
    <Table.Row>
      <Table.Cell>
        <div><b>{snomedCodeDescription}</b></div>
        {prescriptionEndorsements?.map(endorsement =>
          <div key={SHA1(endorsement).toString()}>{endorsement}</div>
        )}
        {dispenserNotes?.map(note => <div key={SHA1(note).toString()}>{note}</div>)}
      </Table.Cell>
      <Table.Cell>{quantityValue}</Table.Cell>
      <Table.Cell>{quantityUnit}</Table.Cell>
      <Table.Cell>{dosageInstruction?.map(note => <div key={SHA1(note).toString()}>{note}</div>)}</Table.Cell>
      {prescriptionHasControlledDrug && <Table.Cell>{controlledDrugSchedule}</Table.Cell>}
    </Table.Row>
  )
}

function createSummaryMedication(medicationRequest: MedicationRequest): SummaryMedication {
  const quantity = medicationRequest.dispenseRequest.quantity
  const snomedInformation = medicationRequest.medicationCodeableConcept.coding[0]

  const summary: SummaryMedication = {
    quantityUnit: quantity.unit,
    quantityValue: quantity.value,
    snomedCodeDescription: snomedInformation.display
  }

  const prescriberEndorsementExtensions = getPrescriptionEndorsementExtensions(medicationRequest.extension)
  if (prescriberEndorsementExtensions) {
    summary.prescriptionEndorsements = prescriberEndorsementExtensions.map(endorsement =>
      endorsement.valueCodeableConcept.coding[0].code
    )
  }

  const controlledDrugExtension = getControlledDrugExtensions(medicationRequest.extension)[0]
  if (controlledDrugExtension) {
    const scheduleExtension = getScheduleExtensions(controlledDrugExtension.extension)[0]
    summary.controlledDrugSchedule = scheduleExtension.valueCoding.code
  }

  if (medicationRequest.note) {
    summary.dispenserNotes = medicationRequest.note
      .filter(note => note.text)
      .map(note => note.text)
  }

  if (medicationRequest.dosageInstruction) {
    summary.dosageInstruction = medicationRequest.dosageInstruction
      .filter(dosage => dosage.text)
      .map(dosage => dosage.text)
  }

  return summary
}

export {
  createSummaryMedication,
  MedicationSummaryTable,
  SummaryMedication
}

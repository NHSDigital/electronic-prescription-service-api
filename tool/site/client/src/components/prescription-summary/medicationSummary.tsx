import * as React from "react"
import {MedicationRequest} from "fhir/r4"
import {Table} from "nhsuk-react-components"
import {getPrescriptionEndorsementExtensions} from "../../fhir/customExtensions"

export function createSummaryMedication(medicationRequest: MedicationRequest): SummaryMedication {
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

export interface SummaryMedication {
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

const MedicationSummary: React.FC<MedicationSummaryProps> = ({medicationSummaryList}) => {
  return (
    <Table.Panel heading="Medication">
      <Table caption="Medication summary">
        <Table.Head>
          <Table.Row>
            <Table.Cell>Details</Table.Cell>
            <Table.Cell>Quantity</Table.Cell>
            <Table.Cell>Unit</Table.Cell>
            <Table.Cell>Dosage Instructions</Table.Cell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {medicationSummaryList.map((medication, index) => <MedicationRow key={index} {...medication} />)}
        </Table.Body>
      </Table>
    </Table.Panel>
  )
}

const MedicationRow: React.FC<SummaryMedication> = ({
  dispenserNotes,
  dosageInstruction,
  prescriptionEndorsements,
  quantityUnit,
  quantityValue,
  snomedCodeDescription
}) => <Table.Row>
  <Table.Cell>
    <div><b>{snomedCodeDescription}</b></div>
    {prescriptionEndorsements?.map((endorsement, index) =>
      <div key={index}>{endorsement}</div>
    )}
    {dispenserNotes?.map((note, index) => <div key={index}>{note}</div>)}
  </Table.Cell>
  <Table.Cell>{quantityValue}</Table.Cell>
  <Table.Cell>{quantityUnit}</Table.Cell>
  <Table.Cell>{dosageInstruction?.map((note, index) => <div key={index}>{note}</div>)}</Table.Cell>
</Table.Row>

export default MedicationSummary

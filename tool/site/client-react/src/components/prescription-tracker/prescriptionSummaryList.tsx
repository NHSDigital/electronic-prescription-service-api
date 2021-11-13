import * as React from "react"
import {SummaryList} from "nhsuk-react-components"
import {Reference, Task} from "fhir/r4"
import {formatNhsNumber} from "../../formatters/demographics"
import {formatDate} from "../../formatters/dates"
import {getCourseOfTherapyTypeExtension} from "../../fhir/customExtensions"

export interface PrescriptionSummaryProps {
  id: string
  type: string
  patientNhsNumber: string
  creationDate: string
  status: string
  prescriber?: string
  dispenser?: string
}

export function createPrescriptionSummaryProps(task: Task): PrescriptionSummaryProps {
  return {
    id: task.focus.identifier.value,
    type: getCourseOfTherapyTypeExtension(task.extension).valueCoding.display,
    patientNhsNumber: formatNhsNumber(task.for.identifier.value),
    creationDate: formatDate(task.authoredOn),
    status: task.businessStatus.coding[0].display,
    prescriber: task.requester && formatReference(task.requester),
    dispenser: task.owner && formatReference(task.owner)
  }
}

function formatReference(reference: Reference): string {
  return reference.display
    ? `${reference.display} (${reference.identifier.value})`
    : reference.identifier.value
}

export const PrescriptionSummaryList: React.FC<PrescriptionSummaryProps> = ({
  id,
  type,
  patientNhsNumber,
  prescriber,
  dispenser,
  creationDate,
  status
}) => {
  const dispenserDesc = status === "To Be Dispensed" ? "Nominated Dispenser" : "Assigned Dispenser"
  return (
    <SummaryList>
      <SummaryList.Row>
        <SummaryList.Key>ID</SummaryList.Key>
        <SummaryList.Value>{id}</SummaryList.Value>
      </SummaryList.Row>
      <SummaryList.Row>
        <SummaryList.Key>Type</SummaryList.Key>
        <SummaryList.Value>{type}</SummaryList.Value>
      </SummaryList.Row>
      <SummaryList.Row>
        <SummaryList.Key>NHS Number</SummaryList.Key>
        <SummaryList.Value>{patientNhsNumber}</SummaryList.Value>
      </SummaryList.Row>
      {prescriber && (
        <SummaryList.Row>
          <SummaryList.Key>Prescriber</SummaryList.Key>
          <SummaryList.Value>{prescriber}</SummaryList.Value>
        </SummaryList.Row>
      )}
      {dispenser && (
        <SummaryList.Row>
          <SummaryList.Key>{dispenserDesc}</SummaryList.Key>
          <SummaryList.Value>{dispenser}</SummaryList.Value>
        </SummaryList.Row>
      )}
      <SummaryList.Row>
        <SummaryList.Key>Created On</SummaryList.Key>
        <SummaryList.Value>{creationDate}</SummaryList.Value>
      </SummaryList.Row>
      <SummaryList.Row>
        <SummaryList.Key>Status</SummaryList.Key>
        <SummaryList.Value>{status}</SummaryList.Value>
      </SummaryList.Row>
    </SummaryList>
  )
}

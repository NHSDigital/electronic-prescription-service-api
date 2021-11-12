import * as React from "react"
import {SummaryList} from "nhsuk-react-components"
import {Task} from "fhir/r4"
import {formatNhsNumber} from "../../../formatters/demographics"
import {formatDate} from "../../../formatters/dates"
import {getCourseOfTherapyTypeExtension} from "../../../fhir/customExtensions"

export interface PrescriptionDetailProps {
  id: string
  type: string
  patientNhsNumber: string
  creationDate: string
  status: string
  dispenserOdsCode?: string
}

export function createPrescriptionDetailProps(task: Task): PrescriptionDetailProps {
  return {
    id: task.focus.identifier.value,
    type: getCourseOfTherapyTypeExtension(task.extension).valueCoding.display,
    patientNhsNumber: formatNhsNumber(task.for.identifier.value),
    creationDate: formatDate(task.authoredOn),
    status: task.businessStatus.coding[0].display,
    dispenserOdsCode: task.owner?.identifier?.value
  }
}

export const PrescriptionDetails: React.FC<PrescriptionDetailProps> = ({
  id,
  type,
  patientNhsNumber,
  dispenserOdsCode,
  creationDate,
  status
}) => {
  const dispenserDesc = status === "To Be Dispensed" ? "Nominated Dispenser ODS Code" : "Assigned Dispenser ODS Code"
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
      {dispenserOdsCode && (
        <SummaryList.Row>
          <SummaryList.Key>{dispenserDesc}</SummaryList.Key>
          <SummaryList.Value>{dispenserOdsCode}</SummaryList.Value>
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

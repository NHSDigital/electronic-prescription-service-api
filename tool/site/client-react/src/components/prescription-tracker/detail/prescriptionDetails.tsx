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
  pharmacy?: { context: string, code: string }
  status: string
}

export function createPrescriptionDetailProps(task: Task): PrescriptionDetailProps {
  const status = task.businessStatus.coding[0].display
  const pharmacyOdsCode = task.owner?.identifier?.value
  const pharmacyContext = status === "To Be Dispensed" ? "Nominated Pharmacy ODS Code" : "Assigned Pharmacy ODS Code"
  return {
    id: task.focus.identifier.value,
    type: getCourseOfTherapyTypeExtension(task.extension).valueCoding.display,
    patientNhsNumber: formatNhsNumber(task.for.identifier.value),
    creationDate: formatDate(task.authoredOn),
    pharmacy: pharmacyOdsCode
      ? {
        context: pharmacyContext,
        code: pharmacyOdsCode
      }
      : undefined,
    status
  }
}

export const PrescriptionDetails: React.FC<PrescriptionDetailProps> = ({
  id,
  type,
  patientNhsNumber,
  pharmacy,
  creationDate,
  status
}) => {
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
      {pharmacy &&
      <SummaryList.Row>
        <SummaryList.Key>{pharmacy.context}</SummaryList.Key>
        <SummaryList.Value>{pharmacy.code}</SummaryList.Value>
      </SummaryList.Row>
      }
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

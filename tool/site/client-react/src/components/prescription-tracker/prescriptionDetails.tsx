import * as React from "react"
import {SummaryList} from "nhsuk-react-components"
import {PrescriptionProps} from "./prescription"
import {Task} from "fhir/r4"
import {formatNhsNumber} from "../../formatters/demographics"
import {formatDate} from "../../formatters/dates"
import {getCourseOfTherapyTypeExtension} from "../../fhir/customExtensions"

export interface PrescriptionDetailProps {
  id: string
  type: string
  patientNhsNumber: string
  creationDate: string
  pharmacy: string
  status: string
}

export function createPrescriptionDetailProps(task: Task): PrescriptionDetailProps {
  const prescriptionType = getCourseOfTherapyTypeExtension(task.extension).valueCoding.code
  return {
    id: task.focus.identifier.value,
    type: prescriptionType.substring(0, 1).toUpperCase() + prescriptionType.substring(1),
    patientNhsNumber: formatNhsNumber(task.for.identifier.value),
    creationDate: formatDate(task.authoredOn),
    pharmacy: task.owner.identifier.value,
    status: task.businessStatus.coding[0].display
  }
}

export const PrescriptionDetails: React.FC<PrescriptionProps> = ({prescription}) => {
  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <SummaryList>
      <SummaryList.Row>
        <SummaryList.Key>ID</SummaryList.Key>
        <SummaryList.Value>{prescription.id}</SummaryList.Value>
      </SummaryList.Row>
      <SummaryList.Row>
        <SummaryList.Key>Type</SummaryList.Key>
        <SummaryList.Value>{prescription.type}</SummaryList.Value>
      </SummaryList.Row>
      <SummaryList.Row>
        <SummaryList.Key>NHS Number</SummaryList.Key>
        <SummaryList.Value>{prescription.patientNhsNumber}</SummaryList.Value>
      </SummaryList.Row>
      <SummaryList.Row>
        <SummaryList.Key>Created On</SummaryList.Key>
        <SummaryList.Value>{prescription.creationDate}</SummaryList.Value>
      </SummaryList.Row>
      <SummaryList.Row>
        <SummaryList.Key>Pharmacy</SummaryList.Key>
        <SummaryList.Value>{prescription.pharmacy}</SummaryList.Value>
      </SummaryList.Row>
      <SummaryList.Row>
        <SummaryList.Key>Status</SummaryList.Key>
        <SummaryList.Value>{prescription.status}</SummaryList.Value>
      </SummaryList.Row>
    </SummaryList>
  )
}

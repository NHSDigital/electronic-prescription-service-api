import * as React from "react"
import {SummaryList} from "nhsuk-react-components"
import {PrescriptionProps} from "./prescription"
import {Task} from "fhir/r4"

export interface PrescriptionDetailProps {
  id: string
  type: string
  patientNhsNumber: string
  creationDate: string
  pharmacy: string
  status: string
}

export function createPrescriptionDetailProps(task: Task): PrescriptionDetailProps {
  return {
    id: task.focus.identifier.value,
    type: task.extension.find(e => e.url === "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-Prescription")
      ?.extension?.find(e => e.url === "courseOfTherapyType")?.valueCoding?.code,
    patientNhsNumber: task.for.identifier.value,
    creationDate: task.authoredOn,
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

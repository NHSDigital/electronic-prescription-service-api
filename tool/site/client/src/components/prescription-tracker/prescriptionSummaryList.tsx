import * as React from "react"
import {SummaryList} from "nhsuk-react-components"
import {Reference, Task} from "fhir/r4"
import {formatNhsNumber} from "../../formatters/demographics"
import {getCourseOfTherapyTypeExtension} from "../../fhir/customExtensions"
import moment from "moment"
import {formatMomentAsDate} from "../../formatters/dates"
import PrescriptionActions from "../common/prescriptionActions"
import styled from "styled-components"
import * as fhir from "fhir/r4"

export interface PrescriptionSummaryProps {
  id: string
  type: string
  patientNhsNumber: string
  creationDate: moment.Moment
  status: string
  prescriber?: string
  dispenser?: string
}

export function createPrescriptionSummaryProps(task: Task): PrescriptionSummaryProps {
  const containedOrganization = task.contained
    ?.find(resource => resource?.resourceType === "Organization") as fhir.Organization

  return {
    id: task.focus.identifier.value,
    type: getCourseOfTherapyTypeExtension(task.extension).valueCoding.display,
    patientNhsNumber: formatNhsNumber(task.for.identifier.value),
    creationDate: moment.utc(task.authoredOn),
    status: task.businessStatus.coding[0].display,
    prescriber: formatOrganization(containedOrganization),
    dispenser: task.owner && formatReference(task.owner)
  }
}

function formatOrganization(organization: fhir.Organization): string {
  return `${organization.name} (${organization.identifier[0].value})`
}

function formatReference(reference: Reference): string {
  return reference.display
    ? `${reference.display} (${reference.identifier.value})`
    : reference.identifier.value
}

const StyledPrescriptionActions = styled(PrescriptionActions)`
  margin-top: 1em;
`

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
        <SummaryList.Value>{formatMomentAsDate(creationDate)}</SummaryList.Value>
      </SummaryList.Row>
      <SummaryList.Row>
        <SummaryList.Key>Status</SummaryList.Key>
        <SummaryList.Value>
          <p>{status}</p>
          {status === "To Be Dispensed" &&
            <StyledPrescriptionActions prescriptionId={id} cancel release />
          }
          {status === "With Dispenser" &&
            <StyledPrescriptionActions prescriptionId={id} cancel verify dispense releaseReturn />
          }
          {status === "With Dispenser - Active" &&
            <StyledPrescriptionActions prescriptionId={id} cancel dispense withdraw />
          }
          {status === "Dispensed" &&
            <StyledPrescriptionActions prescriptionId={id} cancel withdraw />
          }
        </SummaryList.Value>
      </SummaryList.Row>
    </SummaryList>
  )
}

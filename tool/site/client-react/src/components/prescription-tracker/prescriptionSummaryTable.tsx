import {ActionLink, Table} from "nhsuk-react-components"
import {PrescriptionSummaryProps} from "./prescriptionSummaryList"
import React from "react"
import styled from "styled-components"

interface TrackerSummaryTableProps {
  prescriptions: Array<PrescriptionSummaryProps>
  selectPrescription: React.Dispatch<React.SetStateAction<string>>
}

const StyledTable = styled(Table)`
  .nhsuk-action-link {
    margin-bottom: 0;
  }
`

const PrescriptionSummaryTable: React.FC<TrackerSummaryTableProps> = ({
  prescriptions,
  selectPrescription
}) => {
  return (
    <StyledTable caption="Prescription Search Results">
      <Table.Head>
        <Table.Row>
          <Table.Cell>ID</Table.Cell>
          <Table.Cell>NHS Number</Table.Cell>
          <Table.Cell>Status</Table.Cell>
          <Table.Cell>Creation Date</Table.Cell>
          <Table.Cell/>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {prescriptions.map(prescription => (
          <Table.Row key={prescription.id}>
            <Table.Cell>{prescription.id}</Table.Cell>
            <Table.Cell>{prescription.patientNhsNumber}</Table.Cell>
            <Table.Cell>{prescription.status}</Table.Cell>
            <Table.Cell>{prescription.creationDate}</Table.Cell>
            <Table.Cell>
              <ActionLink onClick={() => selectPrescription(prescription.id)}>
                View Details
              </ActionLink>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </StyledTable>
  )
}

export default PrescriptionSummaryTable

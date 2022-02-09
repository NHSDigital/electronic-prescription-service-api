import {Label, Table} from "nhsuk-react-components"
import React from "react"
import * as fhir from "fhir/r4"

interface DispenseNotificationsTableProps {
  dispenseNotifications: Array<fhir.Bundle>;
}

const dispenseNotificationsTable: React.FC<DispenseNotificationsTableProps> = ({dispenseNotifications}) => {
  const lastDispenseNotification = dispenseNotifications.pop()
  return (
    <Table.Panel heading={"Dispense Notifications"}>
      {dispenseNotifications.length === 0 ? <Label>None found.</Label> :
        <Table>
          <Table.Head>
            <Table.Row>
              <Table.Cell>ID</Table.Cell>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {dispenseNotifications.map((dispenseNotification, index) =>
              <Table.Row key={index} >
                <Table.Cell>{dispenseNotification.id}</Table.Cell>
              </Table.Row>
            )}
            <Table.Row key={dispenseNotifications.length} style={{backgroundColor: "rgba(0, 0, 50, 0.05)"}}>
              <Table.Cell>{lastDispenseNotification.id}</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      }
    </Table.Panel>
  )
}

export default dispenseNotificationsTable

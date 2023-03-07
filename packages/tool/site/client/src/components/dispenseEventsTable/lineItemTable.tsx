import * as React from "react"
import {Table} from "nhsuk-react-components"
import {DispenseEventItemChanges} from "./dispenseEventTable"
import {sha1} from "object-hash"

export const LineItemTable: React.FC<{items: Array<DispenseEventItemChanges>}> = ({
  items
}) => {
  return (
    <Table>
      <Table.Head>
        <Table.Row>
          <Table.Cell>Medication Code</Table.Cell>
          <Table.Cell>Medication Name</Table.Cell>
          <Table.Cell>Item Status</Table.Cell>
          <Table.Cell>Quantity</Table.Cell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {items.map(item =>
          <DispenseEventItemRow
            key={sha1(item)}
            itemMedicationCode={item.itemMedicationCode}
            itemMedicationName={item.itemMedicationName}
            itemStatus={item.itemStatus}
            quantity={item.quantity}
          />
        )}
      </Table.Body>
    </Table>
  )
}

const DispenseEventItemRow: React.FC<DispenseEventItemChanges> = ({
  itemMedicationCode,
  itemMedicationName,
  itemStatus,
  quantity
}) => {
  return (
    <Table.Row>
      <Table.Cell>{itemMedicationCode}</Table.Cell>
      <Table.Cell>{itemMedicationName}</Table.Cell>
      <Table.Cell>{itemStatus}</Table.Cell>
      <Table.Cell>{quantity}</Table.Cell>
    </Table.Row>
  )
}

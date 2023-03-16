import * as React from "react"
import {Table} from "nhsuk-react-components"
import {DispenseEventItemChanges} from "./dispenseEventTable"
import {SHA1} from "crypto-js"

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
            id={item.id}
            key={SHA1(item.id).toString()}
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

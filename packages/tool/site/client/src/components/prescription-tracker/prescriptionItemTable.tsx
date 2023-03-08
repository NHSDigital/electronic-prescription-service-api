import * as React from "react"
import {Table} from "nhsuk-react-components"
import {Task} from "fhir/r4"
import {getDateLastDispensedExtension, getDispenseStatusExtension} from "../../fhir/customExtensions"
import {formatDate} from "../../formatters/dates"

interface PrescriptionItemTableProps {
  items: Array<PrescriptionItemProps>
}

export interface PrescriptionItemProps {
  identifier: string
  dispenseStatus: string
  dateLastDispensed?: string
}

export function createPrescriptionItemProps(task: Task): Array<PrescriptionItemProps> {
  return task.input.map(input => {
    const dateLastDispensedExtension = getDateLastDispensedExtension(input.extension)
    const dateLastDispensed = dateLastDispensedExtension && formatDate(dateLastDispensedExtension.valueDateTime)
    return {
      identifier: input.valueReference.identifier.value,
      dispenseStatus: getDispenseStatusExtension(input.extension).valueCoding.display,
      dateLastDispensed: dateLastDispensed
    }
  })
}

export const PrescriptionItemTable: React.FC<PrescriptionItemTableProps> = ({
  items
}) => {
  return (
    <Table.Panel heading="Items">
      <Table caption="Item summary">
        <Table.Head>
          <Table.Row>
            <Table.Cell>Identifier</Table.Cell>
            <Table.Cell>Status</Table.Cell>
            <Table.Cell>Last Dispensed</Table.Cell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {items.map(item => <PrescriptionItemRow key={item.identifier} {...item}/>)}
        </Table.Body>
      </Table>
    </Table.Panel>
  )
}

const PrescriptionItemRow: React.FC<PrescriptionItemProps> = ({
  identifier,
  dispenseStatus,
  dateLastDispensed
}) => <Table.Row>
  <Table.Cell>{identifier}</Table.Cell>
  <Table.Cell>{dispenseStatus}</Table.Cell>
  <Table.Cell>{dateLastDispensed || "N/A"}</Table.Cell>
</Table.Row>

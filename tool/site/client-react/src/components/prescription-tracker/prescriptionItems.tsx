import * as React from "react"
import {Table} from "nhsuk-react-components"
import {PrescriptionProps} from "./prescription"
import {Task} from "fhir/r4"

export interface PrescriptionItemProps {
  identifier: string
  dispenseStatus: string
}

export function createPrescriptionItemProps(task: Task): Array<PrescriptionItemProps> {
  return task.input.map(input => {
    return {
      identifier: input.valueReference.identifier.value,
      dispenseStatus: input.extension.find(e => e.url === "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-DispensingInformation")
        ?.extension?.find(e => e.url === "dispenseStatus")?.valueCoding.display
    }
  })
}

export const PrescriptionItems: React.FC<PrescriptionProps> = ({prescriptionItems}) => {
  return (
    <Table.Panel heading="Items">
      <Table caption="Item summary">
        <Table.Head>
          <Table.Row>
            <Table.Cell>Identifier</Table.Cell>
            <Table.Cell>Status</Table.Cell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {prescriptionItems.map((item, index) => <ItemRow key={index} {...item} />)}
        </Table.Body>
      </Table>
    </Table.Panel>
  )
}

const ItemRow: React.FC<PrescriptionItemProps> = ({
  identifier,
  dispenseStatus
}) => <Table.Row>
  <Table.Cell>{identifier}</Table.Cell>
  <Table.Cell>{dispenseStatus}</Table.Cell>
</Table.Row>

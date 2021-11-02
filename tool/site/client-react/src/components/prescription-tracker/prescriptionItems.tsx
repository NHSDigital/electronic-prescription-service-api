import * as React from "react"
import {Table} from "nhsuk-react-components"
import {PrescriptionProps} from "./prescription"
import {Task} from "fhir/r4"

export interface PrescriptionItemProps {
  identifier: string
  dispenseStatus: string
  dispenseEvents: DispenseEvent[]
}

interface DispenseEvent {
  description: string
}

export function createPrescriptionItemProps(task: Task): PrescriptionItemProps[] {
  // todo: validate how a prescriptionItem maps to multiple dispense events, coding array?
  const prescriptionItemDispenseEvents = new Map<string, DispenseEvent[]>()
  task.output.forEach(output => {
    const prescriptionItemIdentifier = output.valueReference.identifier.value
    prescriptionItemDispenseEvents.set(
      prescriptionItemIdentifier,
      output.type.coding.map(coding => {
        return {description: coding.display}
      }))
  })

  const prescriptionItems = task.input.map(input => {
    return {
      identifier: input.valueReference.identifier.value,
      dispenseStatus: input.extension.find(e => e.url === "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-DispensingInformation")
        ?.extension?.find(e => e.url === "dispenseStatus")?.valueCoding.display,
      dispenseEvents: prescriptionItemDispenseEvents.get(input.valueReference.identifier.value)
    }
  })

  return prescriptionItems
}

export const PrescriptionItems: React.FC<PrescriptionProps> = ({prescriptionItems}) => {
  return (
    <Table.Panel heading="Items">
      <Table caption="Item summary">
        <Table.Head>
          <Table.Row>
            <Table.Cell>Identifier</Table.Cell>
            <Table.Cell>Status</Table.Cell>
            <Table.Cell>Dispense Events</Table.Cell>
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
  dispenseStatus,
  dispenseEvents
}) => <Table.Row>
  <Table.Cell>{identifier}</Table.Cell>
  <Table.Cell>{dispenseStatus}</Table.Cell>
  <Table.Cell>{dispenseEvents?.map((event, index) => <div key={index}>{event.description}</div>)}</Table.Cell>
</Table.Row>

import * as React from "react"
import {useState} from "react"
import {Icons, Table} from "nhsuk-react-components"
import {
  getTaskBusinessStatusExtension
} from "../../fhir/customExtensions"
import {VALUE_SET_PRESCRIPTION_STATUS} from "../../fhir/reference-data/valueSets"
import {Bundle} from "fhir/r4"
import {getMedicationDispenseResources} from "../../fhir/bundleResourceFinder"
import {MedicationDispense} from "../../fhir/helpers"
import {getLineItemStatus} from "../../pages/dispensePage"

interface DispenseEventsTableProps {
  events: Array<DispenseEventProps>
}

export interface DispenseEventProps {
  identifier: string
  prescriptionStatus: string
  eventDate: string
  items: Array<DispenseEventItemChanges>
}

interface DispenseEventItemChanges {
  itemMedicationCode: string
  itemMedicationName: string
  itemStatus: string
}

interface DispenseEventItemTableProps {
  items: Array<DispenseEventItemChanges>
}

export function createPrescriptionDispenseEvents(dispenseNotifications: Array<Bundle>): DispenseEventsTableProps {
  return {
    events: dispenseNotifications.map(createPrescriptionDispenseEvent)
  }
}

function createPrescriptionDispenseEvent(dispenseNotification: Bundle): DispenseEventProps {
  const medicationDispenses = getMedicationDispenseResources(dispenseNotification)
  const firstMedicationDispense = medicationDispenses[0]

  const prescriptionStatusExtension = getTaskBusinessStatusExtension(firstMedicationDispense.extension)
  const prescriptionStatusCode = prescriptionStatusExtension.valueCoding.code
  const prescriptionStatus = VALUE_SET_PRESCRIPTION_STATUS.find(status => status.code === prescriptionStatusCode).display

  return {
    identifier: firstMedicationDispense.identifier[0].value,
    prescriptionStatus: prescriptionStatus,
    eventDate: firstMedicationDispense.whenHandedOver,
    items: medicationDispenses.map(createDispenseEventItemChanges)
  }
}

function createDispenseEventItemChanges(medicationDispense: MedicationDispense): DispenseEventItemChanges {
  const medicationCoding = medicationDispense.medicationCodeableConcept.coding[0]
  return {
    itemMedicationCode: medicationCoding.code,
    itemMedicationName: medicationCoding.display,
    itemStatus: getLineItemStatus(medicationDispense)
  }
}

export const DispenseEventsTable: React.FC<DispenseEventsTableProps> = ({
  events
}) => {
  return (
    <Table.Panel heading="Dispense Events">
      <Table caption="Dispensing History">
        <Table.Head>
          <Table.Row>
            <Table.Cell>Identifier</Table.Cell>
            <Table.Cell>Prescription Status</Table.Cell>
            <Table.Cell>Event Date</Table.Cell>
            <Table.Cell/>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {events.map((event, index) => <DispenseEventRow key={index} {...event}/>)}
        </Table.Body>
      </Table>
    </Table.Panel>
  )
}

const DispenseEventRow: React.FC<DispenseEventProps> = ({
  identifier,
  prescriptionStatus,
  eventDate,
  items
}) => {
  const [expanded, setExpanded] = useState<boolean>(false)
  return (
    <>
      <Table.Row>
        <Table.Cell>{identifier}</Table.Cell>
        <Table.Cell>{prescriptionStatus}</Table.Cell>
        <Table.Cell>{eventDate}</Table.Cell>
        <Table.Cell><Icons.ArrowLeft onClick={() => setExpanded(!expanded)}/></Table.Cell>
      </Table.Row>
      <Table.Row>
        {expanded && <DispenseEventItemTable items={items}/>}
      </Table.Row>
    </>
  )
}

const DispenseEventItemTable: React.FC<DispenseEventItemTableProps> = ({
  items
}) => {
  return (
    <Table>
      <Table.Head>
        <Table.Row>
          <Table.Cell>Medication Code</Table.Cell>
          <Table.Cell>Medication Name</Table.Cell>
          <Table.Cell>Item Status</Table.Cell>
          <Table.Cell/>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {Object.values(items).map(item =>
          <Table.Row>
            <Table.Cell>{item.itemMedicationCode}</Table.Cell>
            <Table.Cell>{item.itemMedicationName}</Table.Cell>
            <Table.Cell>{item.itemStatus}</Table.Cell>
          </Table.Row>
        )}
      </Table.Body>
    </Table>
  )
}

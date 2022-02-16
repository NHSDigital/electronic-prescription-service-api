import * as React from "react"
import {Details, SummaryList, Table} from "nhsuk-react-components"
import {
  getTaskBusinessStatusExtension
} from "../../fhir/customExtensions"
import {VALUE_SET_PRESCRIPTION_STATUS} from "../../fhir/reference-data/valueSets"
import {Bundle} from "fhir/r4"
import {getMedicationDispenseResources} from "../../fhir/bundleResourceFinder"
import {MedicationDispense} from "../../fhir/helpers"
import styled from "styled-components"
import {formatDateAndTime} from "../../formatters/dates"

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
  quantity: string
}

const StyledList = styled(SummaryList)`
  padding: 0px 24px 0px 24px;
`

export const DispenseEventsTable: React.FC<DispenseEventsTableProps> = ({
  events
}) => {
  return (
    <Table.Panel heading="Dispense Events">
      <Table>
        <Table.Body>
          {events.map((event, index) => <DispenseEventRow key={index} {...event}/>)}
        </Table.Body>
      </Table>
    </Table.Panel>
  )
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
    eventDate: formatDateAndTime(firstMedicationDispense.whenHandedOver),
    items: medicationDispenses.map(createDispenseEventItemChanges)
  }
}

function createDispenseEventItemChanges(medicationDispense: MedicationDispense): DispenseEventItemChanges {
  const medicationCoding = medicationDispense.medicationCodeableConcept.coding[0]
  const {value, unit} = medicationDispense.quantity
  return {
    itemMedicationCode: medicationCoding.code,
    itemMedicationName: medicationCoding.display,
    itemStatus: medicationDispense.type.coding[0].display,
    quantity: `${value} ${unit}`
  }
}

const DispenseEventRow: React.FC<DispenseEventProps> = ({
  identifier,
  prescriptionStatus,
  eventDate,
  items
}) => {
  return (
    <Details expander>
      <Details.Summary>{eventDate}</Details.Summary>
      <StyledList>
        <SummaryList.Row>
          <SummaryList.Key>ID</SummaryList.Key>
          <SummaryList.Value>{identifier}</SummaryList.Value>
        </SummaryList.Row>
        <SummaryList.Row>
          <SummaryList.Key>Event Date</SummaryList.Key>
          <SummaryList.Value>{eventDate}</SummaryList.Value>
        </SummaryList.Row>
        <SummaryList.Row>
          <SummaryList.Key>Prescription Status</SummaryList.Key>
          <SummaryList.Value>{prescriptionStatus}</SummaryList.Value>
        </SummaryList.Row>
      </StyledList>
      <Details.Text>
        <LineItemTable items={items}/>
      </Details.Text>
    </Details>
  )
}

const LineItemTable: React.FC<{items: Array<DispenseEventItemChanges>}> = ({
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
          <Table.Cell/>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {Object.values(items).map(item =>
          <DispenseEventItemRow
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

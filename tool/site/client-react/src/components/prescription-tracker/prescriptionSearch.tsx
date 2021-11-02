import * as React from "react"
import {useState} from "react"
import {Button, Details, Input, Label, SummaryList, Table} from "nhsuk-react-components"
import Pre from "../pre"
import {Bundle, Task} from "fhir/r4"

interface PrescriptionSearchProps {
  baseUrl: string
  prescriptionId?: string
}

interface PrescriptionSearchCriteria {
  prescriptionId: string
}

interface PrescriptionSearchResults {
  searchset: Bundle
  count: number
  pluralSuffix: string
  prescriptionSummaries: PrescriptionSummaryProps[]
}

interface PrescriptionSummaryProps {
  prescription: Prescription
  prescriptionItems: PrescriptionItem[]
}

interface Prescription {
  id: string
  type: string
  patientNhsNumber: string // todo: format
  creationDate: string // todo: format
  pharmacy: string
  status: string
}

interface PrescriptionItem {
  identifier: string
  dispenseStatus: string
  dispenseEvents: DispenseEvent[]
}

interface DispenseEvent {
  description: string
}

function createPrescriptionSummaryProps(task: Task): PrescriptionSummaryProps {
  const prescription = {
    id: task.focus.identifier.value,
    type: task.extension.find(e => e.url === "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-Prescription")
      ?.extension?.find(e => e.url === "courseOfTherapyType")?.valueCoding?.code,
    patientNhsNumber: task.for.identifier.value,
    creationDate: task.authoredOn,
    pharmacy: task.owner.identifier.value,
    status: task.businessStatus.coding[0].display
  }

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

  return {
    prescription,
    prescriptionItems
  }
}

const Prescription: React.FC<PrescriptionSummaryProps> = ({prescription}) => {
  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <SummaryList>
      <SummaryList.Row>
        <SummaryList.Key>ID</SummaryList.Key>
        <SummaryList.Value>{prescription.id}</SummaryList.Value>
      </SummaryList.Row>
      <SummaryList.Row>
        <SummaryList.Key>Type</SummaryList.Key>
        <SummaryList.Value>{prescription.type}</SummaryList.Value>
      </SummaryList.Row>
      <SummaryList.Row>
        <SummaryList.Key>NHS Number</SummaryList.Key>
        <SummaryList.Value>{prescription.patientNhsNumber}</SummaryList.Value>
      </SummaryList.Row>
      <SummaryList.Row>
        <SummaryList.Key>Created On</SummaryList.Key>
        <SummaryList.Value>{prescription.creationDate}</SummaryList.Value>
      </SummaryList.Row>
      <SummaryList.Row>
        <SummaryList.Key>Pharmacy</SummaryList.Key>
        <SummaryList.Value>{prescription.pharmacy}</SummaryList.Value>
      </SummaryList.Row>
      <SummaryList.Row>
        <SummaryList.Key>Status</SummaryList.Key>
        <SummaryList.Value>{prescription.status}</SummaryList.Value>
      </SummaryList.Row>
    </SummaryList>
  )
}

const PrescriptionItems: React.FC<PrescriptionSummaryProps> = ({prescriptionItems}) => {
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

const ItemRow: React.FC<PrescriptionItem> = ({
  identifier,
  dispenseStatus,
  dispenseEvents
}) => <Table.Row>
  <Table.Cell>{identifier}</Table.Cell>
  <Table.Cell>{dispenseStatus}</Table.Cell>
  <Table.Cell>{dispenseEvents?.map((event, index) => <div key={index}>{event.description}</div>)}</Table.Cell>
</Table.Row>

const PrescriptionSearch: React.FC<PrescriptionSearchProps> = ({
  baseUrl,
  prescriptionId
}) => {
  const [searchCriteria, setSearchCriteria] = useState<PrescriptionSearchCriteria>({prescriptionId: prescriptionId ?? ""})
  const [searchResults, setSearchResults] = useState<PrescriptionSearchResults>(null)

  async function handleSearch() {
    const response = await fetch(`${baseUrl}tracker?prescription_id=${searchCriteria.prescriptionId}`)
    const searchset = await response.json() as Bundle
    const results: PrescriptionSearchResults = {
      searchset,
      count: searchset.total,
      pluralSuffix: searchset.total > 1 || searchset.total === 0 ? "s" : "",
      prescriptionSummaries: searchset.entry.map(e => e.resource as Task).map(createPrescriptionSummaryProps)
    }
    setSearchResults(results)
  }

  function handleReset() {
    setSearchResults(null)
  }

  return (
    <>
      {!searchResults
        ? <div>
          <Label isPageHeading>Search for a Prescription</Label>
          <Input
            label="Prescription ID"
            hint="Use the short form here, e.g. E3E6FA-A83008-41F09Y"
            width={30}
            value={searchCriteria.prescriptionId}
            onChange={event => setSearchCriteria({prescriptionId: event.currentTarget.value})}
          />
          <Button onClick={handleSearch}>Search</Button>
          <Button secondary href={baseUrl}>Back</Button>
        </div>
        : <div>
          <Label isPageHeading>Found {searchResults.count} Prescription{searchResults.pluralSuffix}</Label>
          {/* todo: handle multiple prescriptions */}
          <Prescription {...searchResults.prescriptionSummaries[0]} />
          <PrescriptionItems {...searchResults.prescriptionSummaries[0]} />
          <Details expander>
            <Details.Summary>Show FHIR</Details.Summary>
            <Details.Text>
              <Pre>{JSON.stringify(searchResults.searchset, null, 2)}</Pre>
            </Details.Text>
          </Details>
          <Button secondary onClick={handleReset}>Back</Button>
        </div>
      }
    </>
  )
}

export default PrescriptionSearch

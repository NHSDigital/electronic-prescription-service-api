import * as React from "react"
import {useState} from "react"
import {Button, Input, Label} from "nhsuk-react-components"
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
  prescriptionSummaries: PrescriptionSummary[]
}

interface PrescriptionSummary {
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

function createPrescriptionSummary(task: Task): PrescriptionSummary {
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
      prescriptionSummaries: searchset.entry.map(e => e.resource as Task).map(createPrescriptionSummary)
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
          <Pre>{JSON.stringify(searchResults.prescriptionSummaries, null, 2)}</Pre>
          <Button secondary onClick={handleReset}>Back</Button>
        </div>
      }
    </>
  )
}

export default PrescriptionSearch

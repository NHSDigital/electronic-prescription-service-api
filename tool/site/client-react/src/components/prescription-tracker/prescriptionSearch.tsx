import * as React from "react"
import {useState} from "react"
import {Button, Details, Input, Label} from "nhsuk-react-components"
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

interface PrescriptionSummary {}

function createPrescriptionSummary(task: Task): PrescriptionSummary[] {
  return []
}

const PrescriptionSearch: React.FC<PrescriptionSearchProps> = ({
  baseUrl,
  prescriptionId
}) => {
  const [searchCriteria, setSearchCriteria] = useState<PrescriptionSearchCriteria>({ prescriptionId: prescriptionId ?? "" })
  const [searchResults, setSearchResults] = useState<PrescriptionSearchResults>(null)

  async function handleSearch() {
    const response = await fetch(`${baseUrl}tracker?prescription_id=${searchCriteria.prescriptionId}`)
    const searchset = await response.json() as Bundle
    const results: PrescriptionSearchResults = {
      searchset,
      count: searchset.total,
      pluralSuffix: searchset.total > 1 || searchset.total === 0 ? "s" : "",
      prescriptionSummaries: searchset.entry.map(e => createPrescriptionSummary(e as Task))
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
            onChange={event => setSearchCriteria({ prescriptionId: event.currentTarget.value })}
          />
          <Button onClick={handleSearch}>Search</Button>
          <Button secondary href={baseUrl}>Back</Button>
        </div>
        : <div>
          <Label isPageHeading>Found {searchResults.count} Prescription{searchResults.pluralSuffix}</Label>
          <Details expander>
            <Details.Summary>Details</Details.Summary>
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

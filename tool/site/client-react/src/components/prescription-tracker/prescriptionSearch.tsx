import * as React from "react"
import {useState} from "react"
import {Button, Details, Input, Label} from "nhsuk-react-components"
import Pre from "../pre"

interface PrescriptionSearchProps {
  baseUrl: string
  prescriptionId?: string
}

const PrescriptionSearch: React.FC<PrescriptionSearchProps> = ({
  baseUrl,
  prescriptionId
}) => {
  const [searchCriteria, setSearchCriteria] = useState({prescriptionId: prescriptionId ?? ""})
  const [searchResults, setSearchResults] = useState(null)

  async function handleSearch() {
    const response = await fetch(`${baseUrl}tracker?prescription_id=${searchCriteria.prescriptionId}`)
    const results = await response.json()
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
          <Label isPageHeading>Search Results</Label>
          <Details expander>
            <Details.Summary>Details</Details.Summary>
            <Details.Text>
              <Pre>{JSON.stringify(searchResults, null, 2)}</Pre>
            </Details.Text>
          </Details>
          <Button secondary onClick={handleReset}>Back</Button>
        </div>
      }
    </>
  )
}

export default PrescriptionSearch

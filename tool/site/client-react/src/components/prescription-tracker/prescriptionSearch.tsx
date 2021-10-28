import * as React from "react"
import {Button, Details, Input, Label} from "nhsuk-react-components"
import {useState} from "react"

interface PrescriptionSearchProps {
  baseUrl: string
  prescriptionId?: string
}

const PrescriptionSearch: React.FC<PrescriptionSearchProps> = ({
  baseUrl,
  prescriptionId
}) => {
  const initialSearchCriteria = prescriptionId ? {prescriptionId} : {prescriptionId: ""}
  const initialSearchResults = null
  const [searchCritera, setSearchCritera] = useState(initialSearchCriteria)
  const [searchResults, setsearchResults] = useState(initialSearchResults)
  const preStyle: React.CSSProperties = {
    whiteSpace: "break-spaces",
    overflowWrap: "anywhere"
  }
  return (
    <>
        <Label isPageHeading>Search for a Prescription</Label>
        {!searchResults
          ? <div>
              <Input
                label="Prescription ID"
                hint="Use the short form here, e.g. E3E6FA-A83008-41F09Y"
                width={30}
                value={searchCritera.prescriptionId}
                onChange={event => setSearchCritera({prescriptionId: event.currentTarget.value})}
              />
              <Button onClick={() => search(baseUrl, searchCritera.prescriptionId, setsearchResults)}>Search</Button>
            </div>
          : <div>
              <Details expander>
                <Details.Summary>Results</Details.Summary>
                <Details.Text>
                  <pre style={preStyle}>{JSON.stringify(searchResults, null, 2)}</pre>
                </Details.Text>
              </Details>
              <Button secondary onClick={() => reset(setsearchResults)}>Back</Button>
            </div>
        }
    </>
  )
}

async function search(baseUrl: string, prescriptionId: string, setsearchResults: React.Dispatch<React.SetStateAction<any>>) {
  const response = await fetch(`${baseUrl}tracker?prescription_id=${prescriptionId}`)
  const results = await response.json()
  setsearchResults(results)
}

function reset(setSearchResults: React.Dispatch<React.SetStateAction<any>>) {
  setSearchResults(null)
}

export default PrescriptionSearch

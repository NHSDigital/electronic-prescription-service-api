import * as React from "react"
import {Button, Input, Label} from "nhsuk-react-components"
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
  const [searchCritera, setSearchCritera] = useState(initialSearchCriteria)
  return (
    <>
        <Label isPageHeading>Search for a Prescription</Label>
        <Input
          label="Prescription ID"
          hint="(short form)"
          width={30}
          value={searchCritera.prescriptionId}
          onChange={event => setSearchCritera({prescriptionId: event.currentTarget.value})}
        />  
        <Button onClick={() => search(baseUrl, searchCritera.prescriptionId)}>Search</Button>
    </>
  )
}

function search(baseUrl: string, prescriptionId: string) {
  console.log(JSON.stringify({baseUrl, prescriptionId}))
}

export default PrescriptionSearch

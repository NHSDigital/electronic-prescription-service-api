import * as React from "react"
import {Button, Input, Label} from "nhsuk-react-components"
import {useState} from "react"

function search(baseUrl: string, prescriptionId: string) {
  console.log(JSON.stringify({baseUrl, prescriptionId}))
}

interface PrescriptionSearchProps {
  baseUrl: string
  prescriptionId?: string
}

const PrescriptionSearch: React.FC<PrescriptionSearchProps> = ({
  baseUrl,
  prescriptionId
}) => {
  const initialSeachCriteria = prescriptionId ? {prescriptionId} : {prescriptionId: ""}
  const [searchCritera, setSearchCritera] = useState(initialSeachCriteria)
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

export default PrescriptionSearch

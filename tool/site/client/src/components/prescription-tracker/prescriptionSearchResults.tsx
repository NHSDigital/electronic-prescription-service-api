import {Bundle, Task} from "fhir/r4"
import * as React from "react"
import {useContext, useState} from "react"
import {AppContext} from "../../index"
import LongRunningTask from "../longRunningTask"
import {createPrescriptionSummaryProps} from "./prescriptionSummaryList"
import {Button, Label} from "nhsuk-react-components"
import PrescriptionSummaryTable from "./prescriptionSummaryTable"
import {MessageExpander} from "../messageExpanders"
import ButtonList from "../buttonList"
import {FullPrescriptionDetails, getTasks, retrieveFullPrescriptionDetails} from "../../pages/prescriptionSearchPage"
import PrescriptionSearchResultsDetail from "./prescriptionSearchResultsDetail"

interface PrescriptionSearchResultsProps {
  bundle: Bundle,
  back: () => void
}

const PrescriptionSearchResults: React.FC<PrescriptionSearchResultsProps> = ({
  bundle,
  back
}) => {
  const {baseUrl} = useContext(AppContext)
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string>()

  function handleReset() {
    setSelectedPrescriptionId(undefined)
  }

  if (!selectedPrescriptionId) {
    const prescriptions = getTasks(bundle).map(task => createPrescriptionSummaryProps(task))
    return <>
      <Label isPageHeading>Search Results</Label>
      {prescriptions.length
        ? <PrescriptionSummaryTable prescriptions={prescriptions} selectPrescription={setSelectedPrescriptionId}/>
        : <Label>No results found.</Label>
      }
      <MessageExpander
        name="Response (FHIR)"
        message={JSON.stringify(bundle, null, 2)}
        mimeType="application/json"
      />
      <ButtonList>
        <Button secondary onClick={back}>Back</Button>
      </ButtonList>
    </>
  }

  return (
    <LongRunningTask<FullPrescriptionDetails>
      task={() => retrieveFullPrescriptionDetails(baseUrl, selectedPrescriptionId)}
      loadingMessage="Retrieving full prescription details."
      back={handleReset}
    >
      {prescriptionDetails => <PrescriptionSearchResultsDetail prescriptionDetails={prescriptionDetails} back={handleReset}/>}
    </LongRunningTask>
  )
}

export default PrescriptionSearchResults

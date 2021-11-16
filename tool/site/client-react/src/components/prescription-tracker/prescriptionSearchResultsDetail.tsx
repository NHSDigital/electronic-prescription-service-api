import * as React from "react"
import {createPrescriptionSummaryProps, PrescriptionSummaryList} from "./prescriptionSummaryList"
import {createPrescriptionItemProps, PrescriptionItemTable} from "./prescriptionItemTable"
import {Button, Label} from "nhsuk-react-components"
import {MessageExpander} from "../messageExpanders"
import ButtonList from "../buttonList"
import {Task} from "fhir/r4"

interface PrescriptionSearchResultsDetailProps {
  task: Task,
  back: () => void
}

const PrescriptionSearchResultsDetail: React.FC<PrescriptionSearchResultsDetailProps> = ({
  task,
  back
}) => {
  const prescription = createPrescriptionSummaryProps(task)
  const prescriptionItems = createPrescriptionItemProps(task)
  return <>
    <Label isPageHeading>Prescription Details</Label>
    <PrescriptionSummaryList {...prescription} />
    <PrescriptionItemTable items={prescriptionItems}/>
    <MessageExpander
      name="Response (FHIR)"
      message={JSON.stringify(task, null, 2)}
      mimeType="application/json"
    />
    <ButtonList>
      <Button secondary onClick={back}>Back</Button>
    </ButtonList>
  </>
}

export default PrescriptionSearchResultsDetail

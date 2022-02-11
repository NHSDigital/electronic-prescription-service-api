import * as React from "react"
import {createPrescriptionSummaryProps, PrescriptionSummaryList} from "./prescriptionSummaryList"
import {createPrescriptionItemProps, PrescriptionItemTable} from "./prescriptionItemTable"
import {Button, Label} from "nhsuk-react-components"
import {MessageExpander} from "../messageExpanders"
import ButtonList from "../buttonList"
import {FullPrescriptionDetails} from "../../pages/prescriptionSearchPage"
import {createPrescriptionDispenseEvents, DispenseEventsTable} from "./dispenseEventsTable"

interface PrescriptionSearchResultsDetailProps {
  prescriptionDetails: FullPrescriptionDetails,
  back: () => void
}

const PrescriptionSearchResultsDetail: React.FC<PrescriptionSearchResultsDetailProps> = ({
  prescriptionDetails,
  back
}) => {
  const prescription = createPrescriptionSummaryProps(prescriptionDetails.task)
  const prescriptionItems = createPrescriptionItemProps(prescriptionDetails.task)
  const dispenseEvents = createPrescriptionDispenseEvents(prescriptionDetails.dispenseNotifications).events
  return <>
    <Label isPageHeading>Prescription Details</Label>
    <PrescriptionSummaryList {...prescription}/>
    <PrescriptionItemTable items={prescriptionItems}/>
    {dispenseEvents.length > 0 && <DispenseEventsTable events={dispenseEvents}/>}
    <MessageExpander
      name="Response (FHIR)"
      message={JSON.stringify(prescriptionDetails, null, 2)}
      mimeType="application/json"
    />
    <ButtonList>
      <Button secondary onClick={back}>Back</Button>
    </ButtonList>
  </>
}

export default PrescriptionSearchResultsDetail

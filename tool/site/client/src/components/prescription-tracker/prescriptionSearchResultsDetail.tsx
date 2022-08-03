import * as React from "react"
import {createPrescriptionSummaryProps, PrescriptionSummaryList} from "./prescriptionSummaryList"
import {createPrescriptionItemProps, PrescriptionItemTable} from "./prescriptionItemTable"
import {Button, Label} from "nhsuk-react-components"
import ButtonList from "../common/buttonList"
import {FullPrescriptionDetails} from "../../pages/prescriptionSearchPage"
import {createPrescriptionDispenseEvents, DispenseEventTable} from "../dispenseEventsTable/dispenseEventTable"

// TODO: to be replaced by 
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
  const dispenseEvents = createPrescriptionDispenseEvents(prescriptionDetails.dispenseNotifications)
  return <>
    <Label isPageHeading>Prescription Details</Label>
    <PrescriptionSummaryList {...prescription}/>
    <PrescriptionItemTable items={prescriptionItems}/>
    {dispenseEvents.length > 0 && <DispenseEventTable events={dispenseEvents} prescriptionId={prescription.id}/>}
    <ButtonList>
      <Button secondary onClick={back}>Back</Button>
    </ButtonList>
  </>
}

export default PrescriptionSearchResultsDetail

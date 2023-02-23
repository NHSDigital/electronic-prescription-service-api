import {Bundle} from "fhir/r4"
import {Button} from "nhsuk-react-components"
import React, {useContext} from "react"
import {useHistory} from "react-router-dom"
import ButtonList from "../components/common/buttonList"
import LongRunningTask from "../components/common/longRunningTask"
import {isBundle} from "../fhir/typeGuards"
import {AppContext} from "../index"
import {getDispenseNotificationMessages} from "../requests/retrievePrescriptionDetails"
import {makePrescriptionTrackerRequest} from "../common/prescription-search"

import {
  DispenseEventTable,
  createPrescriptionDispenseEvents
} from "../components/dispenseEventsTable/dispenseEventTable"
import {createPrescriptionSummaryViewProps, PrescriptionSummaryView} from "../components/prescription-summary"

interface TrackerResponse {
  fhirResponse: Bundle
}
interface TrackerViewData extends TrackerResponse {
  dispenseNotifications: Array<Bundle>
}

interface TrackerViewProps {
  prescriptionId: string,
  data: TrackerViewData,
  back: () => void
}

const TrackerView = ({prescriptionId, data, back}: TrackerViewProps) => {
  const {fhirResponse, dispenseNotifications} = data

  const prescriptionSummaryProps = createPrescriptionSummaryViewProps(fhirResponse)

  const dispenseEvents = createPrescriptionDispenseEvents(dispenseNotifications)
  const showDispenseEvents = dispenseEvents.length > 0 && isBundle(fhirResponse)

  return (
    <>
      <PrescriptionSummaryView
        {...prescriptionSummaryProps}
        handleDownload={undefined}
      />

      {/* TODO: Wrong dispense events are returned in sandbox -- canned response */}
      {showDispenseEvents &&
        <DispenseEventTable events={dispenseEvents} prescriptionId={prescriptionId} />
      }

      <ButtonList>
        <Button secondary onClick={back}>Back</Button>
      </ButtonList>
    </>
  )
}

async function retrieveFullPrescription(
  baseUrl: string,
  prescriptionId: string,
  repeatNumber: string
): Promise<TrackerViewData> {
  const request = {prescriptionId, repeatNumber}
  const response = await makePrescriptionTrackerRequest(baseUrl, request)
  const dispenseNotifications = await getDispenseNotificationMessages(baseUrl, prescriptionId)

  return {
    fhirResponse: response,
    dispenseNotifications
  }
}

const TrackerViewPrescriptionPage = ({prescriptionId}: { prescriptionId: string }) => {
  const {baseUrl} = useContext(AppContext)
  const history = useHistory()

  // TODO: use real repeat number
  const repeatNumber = "1"

  const task = () => retrieveFullPrescription(baseUrl, prescriptionId, repeatNumber)
  const back = () => history.goBack()
  return (
    <LongRunningTask<TrackerViewData> task={task} loadingMessage="Retrieving full prescription." back={back}>
      {response => (
        <>
          <TrackerView prescriptionId={prescriptionId} data={response} back={back} />
        </>
      )}
    </LongRunningTask>
  )
}

export default TrackerViewPrescriptionPage

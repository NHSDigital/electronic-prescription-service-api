import {Bundle, OperationOutcome} from "fhir/r4"
import {Button} from "nhsuk-react-components"
import React, {useContext} from "react"
import {useHistory} from "react-router-dom"
import ButtonList from "../components/common/buttonList"
import LongRunningTask from "../components/common/longRunningTask"
import {isBundle} from "../fhir/typeGuards"
import {AppContext} from "../index"
import {axiosInstance} from "../requests/axiosInstance"
import {getResponseDataIfValid} from "../requests/getValidResponse"
import {getDispenseNotificationMessages} from "../requests/retrievePrescriptionDetails"
import {PrescriptionSearchCriteria} from "./prescriptionSearchPage"

import {
  DispenseEventTable,
  createPrescriptionDispenseEvents
} from "../components/dispenseEventsTable/dispenseEventTable"
import {PrescriptionSummaryView} from "../components/prescription"

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

  const dispenseEvents = createPrescriptionDispenseEvents(dispenseNotifications)
  const showDispenseEvents = dispenseEvents.length > 0 && isBundle(fhirResponse)

  return (
    <>
      <PrescriptionSummaryView
        prescriptionBundle={fhirResponse}
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

async function makePrescriptionTrackerRequest(
  baseUrl: string,
  searchCriteria: PrescriptionSearchCriteria
): Promise<Bundle> {
  const params = {
    prescription_id: searchCriteria.prescriptionId,
    repeat_number: searchCriteria.repeatNumber
  }

  const url = `${baseUrl}prescriptionTracker`
  const response = await axiosInstance.get<Bundle | OperationOutcome>(url, {params})
  return getResponseDataIfValid(response, isBundle)
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

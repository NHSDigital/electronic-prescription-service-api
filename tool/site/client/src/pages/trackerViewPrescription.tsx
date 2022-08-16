import {Bundle, OperationOutcome} from "fhir/r4"
import {Button, Label} from "nhsuk-react-components"
import React, {useContext, useMemo} from "react"
import {useHistory} from "react-router-dom"
import ButtonList from "../components/common/buttonList"
import LongRunningTask from "../components/common/longRunningTask"
import {isBundle} from "../fhir/typeGuards"
import {AppContext} from "../index"
import {axiosInstance} from "../requests/axiosInstance"
import {getResponseDataIfValid} from "../requests/getValidResponse"
import {getDispenseNotificationMessages} from "../requests/retrievePrescriptionDetails"
import {PrescriptionSearchCriteria} from "./prescriptionSearchPage"

import {DispenseEventTable} from "../components/dispenseEventsTable/dispenseEventTable"
import MessageExpanders from "../components/messageExpanders"
import {PrescriptionSummaryView} from "../components/prescription"
import {createPrescriptionDispenseEvents} from "../components/prescription/utils"

interface TrackerResponse {
  fhirRequest: Bundle
  xmlResponse?: string
  fhirResponse: Bundle
}
interface TrackerViewData extends TrackerResponse {
  dispenseNotifications: Array<Bundle>
}

interface TrackerViewProps {
  data: TrackerViewData,
  back: () => void
}

const TrackerView = ({data, back}: TrackerViewProps) => {
  const {
    fhirRequest,
    fhirResponse,
    xmlResponse,
    dispenseNotifications
  } = data

  const dispenseEvents = useMemo(
    () => createPrescriptionDispenseEvents(dispenseNotifications), [dispenseNotifications])
  const showDispenseEvents = dispenseEvents.length > 0 && isBundle(fhirResponse)

  return (
    <>
      <Label isPageHeading>
        <span>Spine Prescription Summary</span>
      </Label>

      <PrescriptionSummaryView
        prescriptionBundle={fhirResponse}
        handleDownload={undefined}
      />

      {/* TODO: Wrong dispense events are returned in sandbox -- canned response */}
      {showDispenseEvents &&
        <DispenseEventTable events={dispenseEvents} prescriptionId={fhirResponse.id} />
      }

      <MessageExpanders
        fhirRequest={fhirRequest}
        hl7V3Response={xmlResponse}
        fhirResponse={fhirResponse}
      />

      <ButtonList>
        <Button secondary onClick={back}>Back</Button>
      </ButtonList>
    </>
  )
}

function isSignResponse(data: unknown): data is TrackerResponse {
  const response = data as TrackerResponse
  return "fhirRequest" in response && "fhirResponse" in response
}

async function makePrescriptionTrackerRequest(
  baseUrl: string,
  searchCriteria: PrescriptionSearchCriteria
): Promise<TrackerResponse> {
  const params = {
    prescription_id: searchCriteria.prescriptionId,
    repeat_number: searchCriteria.repeatNumber
  }

  const url = `${baseUrl}prescriptionTracker`
  const response = await axiosInstance.get<TrackerResponse | OperationOutcome>(url, {params})
  return getResponseDataIfValid(response, isSignResponse)
}

async function retrieveFullPrescription(
  baseUrl: string,
  prescriptionId: string,
  repeatNumber: string
): Promise<TrackerViewData> {
  const response = await makePrescriptionTrackerRequest(baseUrl, {prescriptionId, repeatNumber})
  const dispenseNotifications = await getDispenseNotificationMessages(baseUrl, prescriptionId)

  return {
    ...response,
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
          <TrackerView data={response} back={back} />
        </>
      )}
    </LongRunningTask>
  )
}

export default TrackerViewPrescriptionPage

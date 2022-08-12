import {Bundle, OperationOutcome} from "fhir/r4"
import React, {useContext} from "react"
import {useHistory} from "react-router-dom"
import LongRunningTask from "../components/common/longRunningTask"
import {isBundle} from "../fhir/typeGuards"
import {AppContext} from "../index"
import {axiosInstance} from "../requests/axiosInstance"
import {getResponseDataIfValid} from "../requests/getValidResponse"
import {getDispenseNotificationMessages} from "../requests/retrievePrescriptionDetails"
import {PrescriptionSearchCriteria} from "./prescriptionSearchPage"
import {Button, Label} from "nhsuk-react-components"
import ButtonList from "../components/common/buttonList"

import {createPrescriptionDispenseEvents} from "../components/prescription/utils"
import {PrescriptionSummaryView} from "../components/prescription"
import {DispenseEventTable} from "../components/dispenseEventsTable/dispenseEventTable"
import {PaginationWrapper} from "../components/pagination"

interface TrackerResults {
  bundle: Bundle
  dispenseNotifications: Array<Bundle>
}

async function retrieveFullPrescription(baseUrl: string, prescriptionId: string): Promise<TrackerResults> {
  // TODO: use real repeat number
  const bundle = await makePrescriptionTrackerRequest(baseUrl, {prescriptionId, repeatNumber: "1"})
  const dispenseNotifications = await getDispenseNotificationMessages(baseUrl, prescriptionId)

  return {
    bundle,
    dispenseNotifications
  }
}

async function makePrescriptionTrackerRequest(
  baseUrl: string,
  searchCriteria: PrescriptionSearchCriteria
): Promise<Bundle> {
  const params = {
    prescription_id: searchCriteria.prescriptionId,
    repeat_number: searchCriteria.repeatNumber
  }

  const response = await axiosInstance.get<Bundle | OperationOutcome>(`${baseUrl}prescriptionTracker`, {params})
  return getResponseDataIfValid(response, isBundle)
}

interface TrackerViewProps {
  trackerResults: TrackerResults,
  back: () => void
}

const TrackerView = ({trackerResults, back}: TrackerViewProps) => {
  const prescription = trackerResults.bundle
  const dispenseEvents = createPrescriptionDispenseEvents(trackerResults.dispenseNotifications)

  return (
    <PaginationWrapper currentPage={1} totalCount={1} pageSize={1} onPageChange={undefined}>
      <Label isPageHeading>
        <span>Spine Prescription Summary</span>
      </Label>

      <PrescriptionSummaryView
        prescriptionBundle={prescription}
        handleDownload={undefined}
      />

      {/* TODO: Wrong dispense events are returned in sandbox -- canned response */}
      {dispenseEvents.length > 0 && <DispenseEventTable events={dispenseEvents} prescriptionId={prescription.id} />}

      <ButtonList>
        <Button secondary onClick={back}>Back</Button>
      </ButtonList>
    </PaginationWrapper>
  )
}

const TrackerViewPrescriptionPage = (prescriptionId: string) => {
  const {baseUrl} = useContext(AppContext)
  const history = useHistory()

  return (
    <LongRunningTask<TrackerResults>
      task={() => retrieveFullPrescription(baseUrl, prescriptionId)}
      loadingMessage="Retrieving full prescription."
      back={() => history.goBack()}
    >
      {response => <TrackerView trackerResults={response} back={() => history.goBack()} />}
    </LongRunningTask>
  )
}

export default TrackerViewPrescriptionPage

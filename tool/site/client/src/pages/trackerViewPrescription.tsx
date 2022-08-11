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

import {createPrescriptionDispenseEvents, createSummaryPrescriptionViewProps} from "../components/prescription/utils"
import {PrescriptionSummaryView} from "../components/prescription"
import {DispenseEventTable} from "../components/dispenseEventsTable/dispenseEventTable"

interface TrackerPrescriptionBundle {
  bundle: Bundle
  dispenseNotifications: Array<Bundle>
}

async function retrieveTrackerFullPrescriptionDetails(
  baseUrl: string,
  selectedPrescriptionId: string
): Promise<TrackerPrescriptionBundle> {
  // TODO: make request to new tracker endpoint
  // TODO: update frontend to show full prescription like in 'create'
  // TODO: use real repeat number
  const responseBundle = await makePrescriptionTrackerRequest(baseUrl, {
    prescriptionId: selectedPrescriptionId,
    repeatNumber: "1"
  })
  console.log(`>>> detailBundle ${JSON.stringify(responseBundle)}`)

  const dispenseNotifications = await getDispenseNotificationMessages(baseUrl, selectedPrescriptionId)

  return {bundle: responseBundle, dispenseNotifications: dispenseNotifications}
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

interface ViewPrescriptionPageProps {
  prescriptionId?: string
}

interface PrescriptionTrackerResultsProps {
    prescriptionTrackerResponse: TrackerPrescriptionBundle,
    back: () => void
  }

const PrescriptionSearchResultsSummary: React.FC<PrescriptionTrackerResultsProps> = ({
  prescriptionTrackerResponse,
  back
}) => {

  const prescription = prescriptionTrackerResponse.bundle
  const prescriptionSummaryProps = createSummaryPrescriptionViewProps(prescription, 1, 1, undefined, false, undefined)
  const dispenseEvents = createPrescriptionDispenseEvents(prescriptionTrackerResponse.dispenseNotifications)

  return <>
    <Label isPageHeading>Prescription from /Tracker</Label>
    {/* <PrescriptionSummaryList {...prescription}/> */}
    {/* <PrescriptionItemTable items={prescriptionItems}/> */}

    <PrescriptionSummaryView {...prescriptionSummaryProps} editMode={false} errors={undefined} handleDownload={undefined} />

    {/* TODO: Wrong dispense events are returned in sandbox -- canned response */}
    {dispenseEvents.length > 0 && <DispenseEventTable events={dispenseEvents} prescriptionId={prescription.id}/>}

    <ButtonList>
      <Button secondary onClick={back}>Back</Button>
    </ButtonList>
  </>
}

const TrackerViewPrescriptionPage: React.FC<ViewPrescriptionPageProps> = ({
  prescriptionId
}) => {
  const {baseUrl} = useContext(AppContext)
  const history = useHistory()

  return (
    <LongRunningTask<TrackerPrescriptionBundle>
      task={() => retrieveTrackerFullPrescriptionDetails(baseUrl, prescriptionId)}
      loadingMessage="Retrieving full prescription details."
      back={()=> history.goBack()}
    >
      {prescriptionDetails => <PrescriptionSearchResultsSummary prescriptionTrackerResponse={prescriptionDetails} back={()=> history.goBack()}/>}
    </LongRunningTask>
  )
}

export default TrackerViewPrescriptionPage

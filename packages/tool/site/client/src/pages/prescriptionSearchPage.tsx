import * as React from "react"
import {useContext, useState} from "react"
import {Bundle, OperationOutcome, Task} from "fhir/r4"
import {isBundle, isTask} from "../fhir/typeGuards"
import LongRunningTask from "../components/common/longRunningTask"
import {AppContext} from "../index"
import PrescriptionSearchForm from "../components/prescription-tracker/prescriptionSearchForm"
import PrescriptionSearchResults from "../components/prescription-tracker/prescriptionSearchResults"
import {getResponseDataIfValid} from "../requests/getValidResponse"
import {axiosInstance} from "../requests/axiosInstance"
import {createDateRangeQueryParameters} from "../components/prescription-tracker/dateRangeField"
import {getDispenseNotificationMessages} from "../requests/retrievePrescriptionDetails"
import {PrescriptionSearchCriteria} from "../common/prescription-search"

interface PrescriptionSearchPageProps {
  prescriptionId?: string
}

const PrescriptionSearchPage: React.FC<PrescriptionSearchPageProps> = ({
  prescriptionId
}) => {
  const {baseUrl} = useContext(AppContext)
  const [searchCriteria, setSearchCriteria] = useState<PrescriptionSearchCriteria>()

  function handleReset() {
    setSearchCriteria(undefined)
  }

  if (!searchCriteria) {
    return (
      <PrescriptionSearchForm
        prescriptionId={prescriptionId}
        onSubmit={values => setSearchCriteria(values)}
      />
    )
  }

  const prescriptionSearchTask = () => makeTaskTrackerRequest(baseUrl, searchCriteria)
  return (
    <LongRunningTask<Bundle> task={prescriptionSearchTask} loadingMessage="Searching for prescriptions." back={handleReset}>
      {bundle => <PrescriptionSearchResults bundle={bundle} back={handleReset}/>}
    </LongRunningTask>
  )
}

export interface FullPrescriptionDetails {
  task: Task
  dispenseNotifications: Array<Bundle>
}

export async function retrieveFullPrescriptionDetails(
  baseUrl: string,
  selectedPrescriptionId: string
): Promise<FullPrescriptionDetails> {
  const detailBundle = await makeTaskTrackerRequest(baseUrl, {prescriptionId: selectedPrescriptionId})
  const tasks = getTasks(detailBundle)
  if (!tasks.length) {
    throw new Error("Prescription not found")
  }

  const dispenseNotifications = await getDispenseNotificationMessages(baseUrl, selectedPrescriptionId)

  return {task: tasks[0], dispenseNotifications: dispenseNotifications}
}

async function makeTaskTrackerRequest(
  baseUrl: string,
  searchCriteria: PrescriptionSearchCriteria
): Promise<Bundle> {
  const params = toTrackerQueryParams(searchCriteria)
  const response = await axiosInstance.get<Bundle | OperationOutcome>(`${baseUrl}taskTracker`, {params})
  return getResponseDataIfValid(response, isBundle)
}

function toTrackerQueryParams(searchCriteria: PrescriptionSearchCriteria) {
  const searchParams = new URLSearchParams()
  if (searchCriteria.prescriptionId) {
    searchParams.set("focus:identifier", searchCriteria.prescriptionId.toUpperCase())
  }
  if (searchCriteria.patientId) {
    searchParams.set("patient:identifier", searchCriteria.patientId.replace(/ /g, ""))
  }
  if (searchCriteria.businessStatus) {
    searchParams.set("business-status", searchCriteria.businessStatus)
  }
  if (searchCriteria.authoredOn?.type) {
    createDateRangeQueryParameters(searchCriteria.authoredOn)
      .forEach(value => searchParams.append("authored-on", value))
  }
  return searchParams
}

export function getTasks(bundle: Bundle): Array<Task> {
  if (!bundle.entry) {
    return []
  }
  return bundle.entry
    .map(entry => entry.resource)
    .filter(isTask)
}

export default PrescriptionSearchPage

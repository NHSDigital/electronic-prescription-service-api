import * as React from "react"
import {useContext, useState} from "react"
import {Bundle, OperationOutcome, Task} from "fhir/r4"
import {isBundle, isTask} from "../fhir/typeGuards"
import LongRunningTask from "../components/longRunningTask"
import {AppContext} from "../index"
import PrescriptionSearchForm from "../components/prescription-tracker/prescriptionSearchForm"
import PrescriptionSearchResults from "../components/prescription-tracker/prescriptionSearchResults"
import {getResponseDataIfValid} from "../requests/getValidResponse"
import {axiosInstance} from "../requests/axiosInstance"
import moment from "moment"

export interface PrescriptionSearchCriteria {
  prescriptionId?: string
  patientId?: string
  businessStatus?: string
  authoredOn?: ComparatorAndDateValues
}

export interface DateValues {
  day?: string
  month?: string
  year?: string
}

export interface ComparatorAndDateValues extends DateValues {
  comparator?: string
}

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

  const prescriptionSearchTask = () => makeTrackerRequest(baseUrl, searchCriteria)
  return (
    <LongRunningTask<Bundle> task={prescriptionSearchTask} loadingMessage="Searching for prescriptions." back={handleReset}>
      {bundle => <PrescriptionSearchResults bundle={bundle} back={handleReset}/>}
    </LongRunningTask>
  )
}

export async function retrieveFullPrescriptionDetails(
  baseUrl: string,
  selectedPrescriptionId: string
): Promise<Task> {
  const detailBundle = await makeTrackerRequest(baseUrl, {prescriptionId: selectedPrescriptionId})
  const tasks = getTasks(detailBundle)
  if (!tasks.length) {
    throw new Error("Prescription not found")
  }
  return tasks[0]
}

export async function makeTrackerRequest(
  baseUrl: string,
  searchCriteria: PrescriptionSearchCriteria
): Promise<Bundle> {
  const params = toTrackerQueryParams(searchCriteria)
  const response = await axiosInstance.get<Bundle | OperationOutcome>(`${baseUrl}tracker`, {params})
  return getResponseDataIfValid(response, isBundle)
}

function toTrackerQueryParams(searchCriteria: PrescriptionSearchCriteria) {
  const searchParams: Record<string, string> = {}
  if (searchCriteria.prescriptionId) {
    searchParams["focus:identifier"] = searchCriteria.prescriptionId.toUpperCase()
  }
  if (searchCriteria.patientId) {
    searchParams["patient:identifier"] = searchCriteria.patientId.replace(/ /g, "")
  }
  if (searchCriteria.businessStatus) {
    searchParams["business-status"] = searchCriteria.businessStatus
  }
  if (searchCriteria.authoredOn?.comparator) {
    const authoredOnMoment = createMoment(searchCriteria.authoredOn)
    searchParams["authored-on"] = `${searchCriteria.authoredOn.comparator}${authoredOnMoment.format("YYYY-MM-DD")}`
  }
  return searchParams
}

export function createMoment(date: ComparatorAndDateValues): moment.Moment {
  return moment.utc({
    day: parseInt(date.day),
    month: parseInt(date.month) - 1,
    year: parseInt(date.year)
  }, true)
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

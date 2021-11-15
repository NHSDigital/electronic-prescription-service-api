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

export interface PrescriptionSearchCriteria {
  prescriptionId?: string
  patientId?: string
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
  const searchParams = toURLSearchParams(searchCriteria)
  const response = await axiosInstance.get<Bundle | OperationOutcome>(`${baseUrl}tracker?${searchParams.toString()}`)
  return getResponseDataIfValid(response, isBundle)
}

function toURLSearchParams(searchCriteria: PrescriptionSearchCriteria) {
  const searchParams = new URLSearchParams()
  if (searchCriteria.prescriptionId) {
    const prescriptionIdForSearch = searchCriteria.prescriptionId.toUpperCase()
    searchParams.set("focus:identifier", prescriptionIdForSearch)
  }
  if (searchCriteria.patientId) {
    const patientIdForSearch = searchCriteria.patientId.replace(/ /g, "")
    searchParams.set("patient:identifier", patientIdForSearch)
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

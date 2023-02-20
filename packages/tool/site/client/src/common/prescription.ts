import {Bundle, OperationOutcome} from "fhir/r4"
import {isBundle} from "../fhir/typeGuards"
import {axiosInstance} from "../requests/axiosInstance"
import {getResponseDataIfValid} from "../requests/getValidResponse"
import {DateRangeValues} from "../components/prescription-tracker/dateRangeField"

export interface PrescriptionSearchCriteria {
  prescriptionId?: string
  repeatNumber?: string
  patientId?: string
  businessStatus?: string
  authoredOn?: DateRangeValues
}

export async function makePrescriptionTrackerRequest(
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

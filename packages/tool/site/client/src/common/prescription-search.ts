import {Bundle, OperationOutcome} from "fhir/r4"
import {isBundle} from "../fhir/typeGuards"
import {axiosInstance} from "../requests/axiosInstance"
import {getResponseDataIfValid} from "../requests/getValidResponse"

export interface PrescriptionSearchCriteria {
  prescriptionId?: string
  repeatNumber?: string
  patientId?: string
  businessStatus?: string
}

export async function makePrescriptionTrackerRequest(
  baseUrl: string,
  searchCriteria: PrescriptionSearchCriteria
): Promise<Bundle> {
  const params = {
    prescription_id: searchCriteria.prescriptionId,
    repeat_number: searchCriteria?.repeatNumber || "1"
  }

  const url = `${baseUrl}prescriptionTracker`
  const response = await axiosInstance.get<Bundle | OperationOutcome>(url, {params})
  return getResponseDataIfValid(response, isBundle)
}

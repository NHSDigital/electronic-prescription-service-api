import {Bundle, MedicationRequest} from "fhir/r4"
import moment from "moment"
import {convertMomentToISODate} from "../lib/date-time"

/**
 * Models
 */

function getPrescription(baseUrl: string, path: string) {
  const xmlHttp = new XMLHttpRequest()
  xmlHttp.open("GET", `${baseUrl}static/examples/${path}`, false)
  xmlHttp.send(null)
  const bundle = JSON.parse(xmlHttp.responseText)
  setValidityPeriod(bundle)
  return bundle
}

/**
 * Examples
 */
/* eslint-disable max-len */
const PRIMARY_CARE_ACUTE_NOMINATED = (baseUrl: string): string => getPrescription(baseUrl,
  "primary-care/acute/nominated-pharmacy/medical-prescriber/1-Prepare-Request-200_OK.json"
)

const PRIMARY_CARE_REPEAT_PRESCRIBING_NOMINATED = (baseUrl: string): string => getPrescription(baseUrl,
  "primary-care/repeat-prescribing/1-Prepare-Request-200_OK.json"
)

const SECONDARY_CARE_COMMUNITY_ACUTE_NOMINATED = (baseUrl: string): string => getPrescription(baseUrl,
  "secondary-care/community/acute/nominated-pharmacy/clinical-practitioner/1-Prepare-Request-200_OK.json"
)

const SECONDARY_CARE_REPEAT_DISPENSING_NOMINATED = (baseUrl: string): string => getPrescription(baseUrl,
  "secondary-care/community/repeat-dispensing/nominated-pharmacy/clinical-practitioner/single-medication-request/1-Prepare-Request-200_OK.json"
)

const SECONDARY_CARE_COMMUNITY_ACUTE_NON_NOMINATED = (baseUrl: string): string => getPrescription(baseUrl,
  "secondary-care/community/acute/no-nominated-pharmacy/clinical-practitioner/1-Prepare-Request-200_OK.json"
)

const HOMECARE_ACUTE_NOMINATED = (baseUrl: string): string => getPrescription(baseUrl,
  "secondary-care/homecare/acute/nominated-pharmacy/clinical-practitioner/1-Prepare-Request-200_OK.json"
)

function setValidityPeriod(bundle: Bundle) {
  const medicationRequests = bundle.entry
    .map(entry => entry.resource)
    .filter(resource => resource.resourceType === "MedicationRequest") as Array<MedicationRequest>
  const start = convertMomentToISODate(moment.utc())
  const end = convertMomentToISODate(moment.utc().add(1, "month"))
  medicationRequests.forEach(medicationRequest => {
    const validityPeriod = medicationRequest.dispenseRequest.validityPeriod
    if (validityPeriod) {
      validityPeriod.start = start
      validityPeriod.end = end
    }
  })
}

/* eslint-enable max-len */
export default {
  PRIMARY_CARE_ACUTE_NOMINATED,
  PRIMARY_CARE_REPEAT_PRESCRIBING_NOMINATED,
  SECONDARY_CARE_COMMUNITY_ACUTE_NOMINATED,
  SECONDARY_CARE_COMMUNITY_ACUTE_NON_NOMINATED,
  SECONDARY_CARE_REPEAT_DISPENSING_NOMINATED,
  HOMECARE_ACUTE_NOMINATED
}

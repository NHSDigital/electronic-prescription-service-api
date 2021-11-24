import * as fhir from "../models"
import moment from "moment"
import {convertMomentToISODate} from "../lib/date-time"

/**
 * Models
 */
const epsModelsUrl = "static/examples"

function getPrescription(path: string) {
  const xmlHttp = new XMLHttpRequest()
  xmlHttp.open("GET", epsModelsUrl + "/" + path, false)
  xmlHttp.send(null)
  return JSON.parse(xmlHttp.responseText)
}

/**
 * Examples
 */
/* eslint-disable max-len */
const PRIMARY_CARE_ACUTE_NOMINATED = getPrescription(
  "primary-care/acute/nominated-pharmacy/medical-prescriber/1-Prepare-Request-200_OK.json"
)
setValidityPeriod(PRIMARY_CARE_ACUTE_NOMINATED)

const PRIMARY_CARE_REPEAT_PRESCRIBING_NOMINATED = getPrescription(
  "primary-care/repeat-prescribing/1-Prepare-Request-200_OK.json"
)
setValidityPeriod(PRIMARY_CARE_REPEAT_PRESCRIBING_NOMINATED)

const SECONDARY_CARE_COMMUNITY_ACUTE_NOMINATED = getPrescription(
  "secondary-care/community/acute/nominated-pharmacy/clinical-practitioner/1-Prepare-Request-200_OK.json"
)
setValidityPeriod(SECONDARY_CARE_COMMUNITY_ACUTE_NOMINATED)

const SECONDARY_CARE_REPEAT_DISPENSING_NOMINATED = getPrescription(
  "secondary-care/community/repeat-dispensing/nominated-pharmacy/clinical-practitioner/single-medication-request/1-Prepare-Request-200_OK.json"
)
setValidityPeriod(SECONDARY_CARE_REPEAT_DISPENSING_NOMINATED)

const SECONDARY_CARE_COMMUNITY_ACUTE_NON_NOMINATED = getPrescription(
  "secondary-care/community/acute/no-nominated-pharmacy/clinical-practitioner/1-Prepare-Request-200_OK.json"
)
setValidityPeriod(SECONDARY_CARE_COMMUNITY_ACUTE_NON_NOMINATED)

const HOMECARE_ACUTE_NOMINATED = getPrescription(
  "secondary-care/homecare/acute/nominated-pharmacy/clinical-practitioner/1-Prepare-Request-200_OK.json"
)
setValidityPeriod(HOMECARE_ACUTE_NOMINATED)

function setValidityPeriod(bundle: fhir.Bundle) {
  const medicationRequests = bundle.entry
    .map(entry => entry.resource)
    .filter(resource => resource.resourceType === "MedicationRequest") as Array<fhir.MedicationRequest>
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

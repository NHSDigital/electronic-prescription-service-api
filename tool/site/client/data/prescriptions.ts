import {fhir} from "../../../../models"
import {convertMomentToISODate} from "../../../../coordinator"
import {getMedicationRequests} from "../../../../coordinator/src/services/translation/common/getResourcesOfType"
import moment from "moment"

/**
 * Models
 */
const epsModelsUrl =
  "https://raw.githubusercontent.com/NHSDigital/electronic-prescription-service-api/master/examples"

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
const PRIMARY_CARE_REPEAT_PRESCRIBING_NOMINATED = getPrescription(
  "primary-care/repeat-prescribing/1-Prepare-Request-200_OK.json"
)
const SECONDARY_CARE_COMMUNITY_ACUTE_NOMINATED = getPrescription(
  "secondary-care/community/acute/nominated-pharmacy/clinical-practitioner/1-Prepare-Request-200_OK.json"
)
const SECONDARY_CARE_REPEAT_DISPENSING_NOMINATED = getPrescription(
  "secondary-care/community/repeat-dispensing/nominated-pharmacy/clinical-practitioner/single-medication-request/1-Prepare-Request-200_OK.json"
)
const SECONDARY_CARE_COMMUNITY_ACUTE_NON_NOMINATED = getPrescription(
  "secondary-care/community/acute/no-nominated-pharmacy/clinical-practitioner/1-Prepare-Request-200_OK.json"
)
const HOMECARE_ACUTE_NOMINATED = getPrescription(
  "secondary-care/homecare/acute/nominated-pharmacy/clinical-practitioner/1-Prepare-Request-200_OK.json"
)

function setValidityPeriod(bundle: fhir.Bundle) {
  const medicationRequests = getMedicationRequests(bundle)
  const start = convertMomentToISODate(moment.utc())
  const end = convertMomentToISODate(moment.utc().add(1, "month"))
  medicationRequests.forEach(medicationRequest => {
    const validityPeriod = medicationRequest.dispenseRequest.validityPeriod
    validityPeriod.start = start
    validityPeriod.end = end
  })
}

const prescriptions = [
  PRIMARY_CARE_ACUTE_NOMINATED,
  PRIMARY_CARE_REPEAT_PRESCRIBING_NOMINATED,
  SECONDARY_CARE_COMMUNITY_ACUTE_NOMINATED,
  SECONDARY_CARE_COMMUNITY_ACUTE_NON_NOMINATED,
  SECONDARY_CARE_REPEAT_DISPENSING_NOMINATED,
  HOMECARE_ACUTE_NOMINATED
]

prescriptions.forEach(setValidityPeriod)

/* eslint-enable max-len */
export default {...prescriptions}

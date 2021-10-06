import moment from "moment"
import * as uuid from "uuid"
import {Bundle} from "../../models"
import {pageData} from "../../ui/state"
import {TEST_PATIENT} from "../../data/patients"
import {getMessageHeaderResources, getMedicationRequestResources, isRepeatDispensing} from "../read/bundle-parser"
import {getLongFormIdExtension} from "../read/extensions-parser"
import {convertMomentToISODate} from "../../lib/date-time"
import {generateShortFormIdFromExisting} from "./generate-prescription-ids"

export function sanitiseProdTestData(bundle: Bundle): void {
  if (pageData.environment !== "prod") {
    return
  }

  const patientBundleEntry = bundle.entry.find(
    entry => entry.resource.resourceType === "Patient"
  )
  patientBundleEntry.resource = TEST_PATIENT

  const medicationRequests = getMedicationRequestResources(bundle)
  medicationRequests.forEach(medicationRequest => {
    medicationRequest.note = [{text: "TEST PRESCRIPTION - DO NOT DISPENSE"}]
    medicationRequest.dosageInstruction[0].patientInstruction =
      "TEST PRESCRIPTION - DO NOT DISPENSE"
  })
}

export function updateBundleIds(bundle: Bundle): void {
  const firstGroupIdentifier = getMedicationRequestResources(bundle)[0].groupIdentifier

  const newBundleIdentifier = uuid.v4()

  const originalShortFormId = firstGroupIdentifier.value
  const newShortFormId = generateShortFormIdFromExisting(originalShortFormId)
  const newLongFormId = uuid.v4()

  setPrescriptionIds(
    bundle,
    newBundleIdentifier,
    newShortFormId,
    newLongFormId
  )
}

export function updateValidityPeriodIfRepeatDispensing(bundle: Bundle): void {
  if (isRepeatDispensing(bundle)) {
    const start = convertMomentToISODate(moment.utc())
    const end = convertMomentToISODate(moment.utc().add(1, "month"))
    getMedicationRequestResources(bundle).forEach(request => {
      const validityPeriod = request.dispenseRequest.validityPeriod
      validityPeriod.start = start
      validityPeriod.end = end
    })
  }
}

export function updateNominatedPharmacy(bundle: Bundle, odsCode: string): void {
  if (!odsCode) {
    return
  }
  getMessageHeaderResources(bundle).forEach(messageHeader => {
    messageHeader.destination.forEach(destination => {
      destination.receiver.identifier.value = odsCode
    })
  })
  getMedicationRequestResources(bundle).forEach(function (medicationRequest) {
    medicationRequest.dispenseRequest.performer.identifier.value = odsCode
  })
}

function setPrescriptionIds(
  bundle: Bundle,
  newBundleIdentifier: string,
  newShortFormId: string,
  newLongFormId: string
) {
  bundle.identifier.value = newBundleIdentifier
  getMedicationRequestResources(bundle).forEach(function (medicationRequest) {
    const groupIdentifier = medicationRequest.groupIdentifier
    groupIdentifier.value = newShortFormId
    getLongFormIdExtension(
      groupIdentifier.extension
    ).valueIdentifier.value = newLongFormId
  })
}

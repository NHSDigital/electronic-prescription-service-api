import {specification} from "./resources/test-resources"
import {generateResourceId} from "../src/services/translation/cancellation/common"
import {getMedicationRequests, getMessageHeader} from "../src/services/translation/common/getResourcesOfType"
import practitioners from "./resources/message-fragments/practitioner"
import practitionerRoles from "./resources/message-fragments/practitionerRole"
import prescriptionTypeExtensions from "./resources/message-fragments/extensions"
import medicationRequests from "./resources/message-fragments/medicationRequest"
import * as fs from "fs"
import * as path from "path"
import * as fhir from "../src/models/fhir/fhir-resources"
import {convertMomentToISODateTime, getExtensionForUrl} from "../src/services/translation/common"
import * as LosslessJson from "lossless-json"
import moment from "moment"

function generateCancelMessage(
  requestPayload: fhir.Bundle, cancelRole = "nurse", index = 0, statusCode = "0001"
) {
  const cancelMessage = JSON.parse(JSON.stringify(requestPayload)) as fhir.Bundle
  cancelMessage.identifier.value = generateResourceId()
  const cancelMessageHeader = getMessageHeader(cancelMessage)
  cancelMessageHeader.eventCoding.code = "prescription-order-update"
  cancelMessageHeader.eventCoding.display = "Prescription Order Update"

  const entryToKeep = cancelMessage.entry
    .filter(entry => entry.resource.resourceType === "MedicationRequest")[index]

  const emptyBundle = removeMedicationRequests(cancelMessage)
  emptyBundle.entry.push(entryToKeep)

  const cancelMessageMedicationRequest = getMedicationRequests(cancelMessage)
  cancelMessageMedicationRequest[0].statusReason = getStatusReason(statusCode)
  cancelMessageMedicationRequest[0].status = "cancelled"

  const bundleEntries = cancelMessage.entry.filter(
    (entry: fhir.BundleEntry) => entry.resource.resourceType !== "Practitioner"
  )
  bundleEntries.push(practitioners.get(cancelRole))
  cancelMessage.entry = bundleEntries

  return cancelMessage
}

function convertPrescriber(defaultPrescriptionMessage: fhir.Bundle, x: string) {
  const prescriptionTypeUrl = "https://fhir.nhs.uk/R4/StructureDefinition/Extension-DM-prescriptionType"

  const prescriptionMessage = JSON.parse(JSON.stringify(defaultPrescriptionMessage))
  prescriptionMessage.identifier.value = generateResourceId()

  const medicationRequest = getMedicationRequests(prescriptionMessage)
  const prescriptionTypeExtension = getExtensionForUrl(
    medicationRequest[0].extension, prescriptionTypeUrl, ""
  ) as fhir.CodingExtension
  prescriptionTypeExtension.valueCoding = prescriptionTypeExtensions.get(x).valueCoding
  medicationRequest[0].authoredOn = new Date().toISOString()

  const bundleEntries = prescriptionMessage.entry.filter(
    (entry: fhir.BundleEntry) => entry.resource.resourceType !== "Practitioner"
      && entry.resource.resourceType !== "PractitionerRole")
  bundleEntries.push(practitioners.get(x))
  bundleEntries.push(practitionerRoles.get(x))
  prescriptionMessage.entry = bundleEntries

  return prescriptionMessage
}

function removeMedicationRequests(fhirBundle: fhir.Bundle): fhir.Bundle {
  const entries = fhirBundle.entry
    .filter(entry => entry.resource.resourceType !== "MedicationRequest")
  return {
    ...fhirBundle,
    entry: entries
  }
}

describe.skip("generate prescription-order and prescription-order-update messages", () => {
  const originalPrescriptionMessage = specification[1].fhirMessageSigned
  const cases = [
    ["nurse", "nurse"],
    ["nurse", "doctor"],
    ["nurse", "pharmacist"],
    ["doctor", "nurse"],
    ["doctor", "doctor"],
    ["doctor", "pharmacist"],
    ["pharmacist", "nurse"],
    ["pharmacist", "doctor"],
    ["pharmacist", "pharmacist"]
  ]

  test.each(cases)("^", async (prescriber: string, canceller: string) => {
    const shortFormId = newPrescriptionOrder(originalPrescriptionMessage)

    const convertedPrescriptionMessage = convertPrescriber(originalPrescriptionMessage, prescriber)
    fs.writeFileSync(
      path.join(__dirname, `${shortFormId+prescriber+canceller}-prescription-order.json`),
      LosslessJson.stringify(convertedPrescriptionMessage), "utf-8"
    )

    fs.writeFileSync(
      path.join(__dirname, `${shortFormId+prescriber+canceller}-prescription-order-update.json`),
      LosslessJson.stringify(generateCancelMessage(convertedPrescriptionMessage, canceller, 0)), "utf-8"
    )
  })

  function newPrescriptionOrder(bundle: fhir.Bundle) {
    bundle.identifier.value = generateResourceId()
    const timeNow = convertMomentToISODateTime(moment.utc())

    const medicationShortFormId = generateShortFormID()
    getMedicationRequests(bundle)
      .forEach(medicationRequest => {
        medicationRequest.groupIdentifier.value = medicationShortFormId
        const extension = getExtensionForUrl(
          medicationRequest.groupIdentifier.extension,
          "https://fhir.nhs.uk/R4/StructureDefinition/Extension-PrescriptionId",
          ""
        ) as fhir.IdentifierExtension
        extension.valueIdentifier.value = generateResourceId()
        medicationRequest.authoredOn = timeNow
      })
    return medicationShortFormId
  }

  test("create a prescription-order message with multiple medicationRequests", () => {
    const newPrescriptionMessage = removeMedicationRequests(originalPrescriptionMessage)
    expect(getMedicationRequests(newPrescriptionMessage)).toHaveLength(0)

    medicationRequests.forEach(bundleEntry => newPrescriptionMessage.entry.push(bundleEntry))
    const medicationShortFormId = newPrescriptionOrder(newPrescriptionMessage)
    expect(getMedicationRequests(newPrescriptionMessage)).toHaveLength(4)

    const withoutMedicationRequest = removeMedicationRequests(newPrescriptionMessage)
    withoutMedicationRequest.entry.push(medicationRequests.get("nystatin"))
    getMedicationRequests(withoutMedicationRequest)[0].groupIdentifier.value = medicationShortFormId
    expect(getMedicationRequests(withoutMedicationRequest)).toHaveLength(1)
    const cancelMessage = generateCancelMessage(withoutMedicationRequest, "nurse", 0)
    fs.writeFileSync(
      path.join(__dirname, `multi-prescription-order.json`),
      LosslessJson.stringify(newPrescriptionMessage), "utf-8"
    )

    fs.writeFileSync(
      path.join(__dirname, `multi-prescription-order-update.json`),
      LosslessJson.stringify(cancelMessage), "utf-8"
    )
  })

  test.each([
    ["0002"],
    ["0003"],
    ["0004"],
    ["0005"],
    ["0006"],
    ["0007"],
    ["0008"],
    ["0009"]
  ])(
    "create a cancellation pair that has different status reason %s",
    (statusCode: string) => {
      newPrescriptionOrder(originalPrescriptionMessage)
      fs.writeFileSync(
        path.join(__dirname, `${statusCode}-prescription-order.json`),
        LosslessJson.stringify(originalPrescriptionMessage), "utf-8"
      )

      const cancelMessage = generateCancelMessage(originalPrescriptionMessage, "nurse", 0, statusCode)
      fs.writeFileSync(
        path.join(__dirname, `${statusCode}-prescription-order-update.json`),
        LosslessJson.stringify(cancelMessage), "utf-8"
      )
    })
})

const statusReasons = new Map([
  ["0001", "Prescribing Error"],
  ["0002", "Clinical contra-indication"],
  ["0003", "Change to medication treatment regime"],
  ["0004", "Clinical grounds"],
  ["0005", "At the Patient's request"],
  ["0006", "At the Pharmacist's request"],
  ["0007", "Notification of Death"],
  ["0008", "Patient deducted - other reason"],
  ["0009", "Patient deducted - registered with new practice"]
])
function getStatusReason(statusCode: string) {
  return {
    "coding": [
      {
        "system": "https://fhir.nhs.uk/CodeSystem/medicationrequest-status-reason",
        "code": statusCode,
        "display": statusReasons.get(statusCode)
      }
    ]
  }
}

function generateShortFormID() {
  const _PRESC_CHECKDIGIT_VALUES = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ+"
  const hexString = (generateResourceId()).replace(/-/g, "").toUpperCase()
  let prescriptionID = hexString.substring(0, 6) + "-" + "A99968" + "-" + hexString.substring(12, 17)
  const prscID = prescriptionID.replace(/-/g, "")
  const prscIDLength = prscID.length
  let runningTotal = 0
  let checkValue
  const strings = prscID.split("")
  strings.forEach((character, index) => {
    runningTotal = runningTotal + parseInt(character, 36) * (2 ** (prscIDLength - index))
  })
  checkValue = (38 - runningTotal % 37) % 37
  checkValue = _PRESC_CHECKDIGIT_VALUES.substring(checkValue, checkValue+1)
  prescriptionID += checkValue
  return prescriptionID
}

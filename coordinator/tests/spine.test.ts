import {specification} from "./resources/test-resources"
import {generateResourceId, getFullUrl} from "../src/services/translation/cancellation/common"
import {
  getMedicationRequests,
  getMessageHeader,
  getProvenances
} from "../src/services/translation/common/getResourcesOfType"
import practitioners from "./resources/message-fragments/practitioner"
import practitionerRoles from "./resources/message-fragments/practitionerRole"
import prescriptionTypeExtensions from "./resources/message-fragments/extensions"
import medicationRequests from "./resources/message-fragments/medicationRequest"
import * as fs from "fs"
import * as path from "path"
import * as fhir from "../src/models/fhir/fhir-resources"
import {
  convertMomentToISODateTime,
  getExtensionForUrl,
  getExtensionForUrlOrNull
} from "../src/services/translation/common"
import * as LosslessJson from "lossless-json"
import moment from "moment"
import {clone} from "./resources/test-helpers"

function generateCancelMessage(
  requestPayload: fhir.Bundle, itemIndexToCancel = 0, statusCode = "0001"
) {
  const cancelMessage = clone(requestPayload)
  cancelMessage.identifier.value = generateResourceId()
  const cancelMessageHeader = getMessageHeader(cancelMessage)
  cancelMessageHeader.eventCoding.code = "prescription-order-update"
  cancelMessageHeader.eventCoding.display = "Prescription Order Update"

  const entryToKeep = cancelMessage.entry
    .filter(entry => entry.resource.resourceType === "MedicationRequest")[itemIndexToCancel]

  const emptyBundle = removeResourcesOfType(cancelMessage, "MedicationRequest")
  emptyBundle.entry.push(entryToKeep)

  const cancelMessageMedicationRequest = getMedicationRequests(cancelMessage)
  cancelMessageMedicationRequest[0].statusReason = getStatusReason(statusCode)
  cancelMessageMedicationRequest[0].status = "cancelled"

  return removeResourcesOfType(cancelMessage, "Provenance")
}

function setPrescriptionTypeOnMedicationRequests(bundle: fhir.Bundle, practitionerType: string) {
  const practitionerTypeExtension = prescriptionTypeExtensions.get(practitionerType)

  const medicationRequests = getMedicationRequests(bundle)
  medicationRequests.forEach(medicationRequest => {
    const prescriptionTypeExtension = getExtensionForUrl(
      medicationRequest.extension,
      "https://fhir.nhs.uk/R4/StructureDefinition/Extension-DM-prescriptionType",
      "MedicationRequest.extension"
    ) as fhir.CodingExtension
    prescriptionTypeExtension.valueCoding = practitionerTypeExtension.valueCoding
  })

  return bundle
}

function setRequesterOnMedicationRequestsAndProvenance(bundle: fhir.Bundle, practitionerType: string) {
  const practitioner = practitioners.get(practitionerType)
  const practitionerRole = practitionerRoles.get(practitionerType)

  getMedicationRequests(bundle).forEach(medicationRequest => {
    medicationRequest.requester.reference = getFullUrl(practitionerRole.id)
  })

  getProvenances(bundle).flatMap(provenance => provenance.signature).forEach(signature => {
    signature.who.reference = getFullUrl(practitionerRole.id)
  })

  bundle.entry.push(toBundleEntry(practitioner))
  bundle.entry.push(toBundleEntry(practitionerRole))
  return bundle
}

function setResponsiblePartyOnMedicationRequests(bundle: fhir.Bundle, practitionerType: string) {
  const practitioner = practitioners.get(practitionerType)
  const practitionerRole = practitionerRoles.get(practitionerType)

  const medicationRequests = getMedicationRequests(bundle)
  medicationRequests.forEach(medicationRequest => {
    const existingExtension = getExtensionForUrlOrNull(
      medicationRequest.extension,
      "https://fhir.nhs.uk/R4/StructureDefinition/Extension-DM-ResponsiblePractitioner",
      "MedicationRequest.extension"
    ) as fhir.ReferenceExtension<fhir.PractitionerRole>
    medicationRequest.extension.remove(existingExtension)
    medicationRequest.extension.push({
      url: "https://fhir.nhs.uk/R4/StructureDefinition/Extension-DM-ResponsiblePractitioner",
      valueReference: {
        reference: getFullUrl(practitionerRole.id)
      }
    })
  })

  bundle.entry.push(toBundleEntry(practitioner))
  bundle.entry.push(toBundleEntry(practitionerRole))
  return bundle
}

function removeResourcesOfType(fhirBundle: fhir.Bundle, resourceType: string): fhir.Bundle {
  const entriesToRetain = fhirBundle.entry.filter(entry => entry.resource.resourceType !== resourceType)
  return {
    ...fhirBundle,
    entry: entriesToRetain
  }
}

function toBundleEntry(resource: fhir.Resource) {
  return {
    resource: resource,
    fullUrl: getFullUrl(resource.id)
  }
}

describe.skip("tool to generate prescription-order and prescription-order-update messages", () => {
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

  test.each(cases)(
    "create prescription-order messages that are cancelled by a different user",
    async (prescriber: string, canceller: string) => {
      let prescriptionOrderMessage = removeResourcesOfType(originalPrescriptionMessage, "Practitioner")
      prescriptionOrderMessage = removeResourcesOfType(prescriptionOrderMessage, "PractitionerRole")
      const shortFormId = setIdsAndTimestamps(prescriptionOrderMessage)
      setPrescriptionTypeOnMedicationRequests(prescriptionOrderMessage, prescriber)
      setRequesterOnMedicationRequestsAndProvenance(prescriptionOrderMessage, prescriber)

      fs.writeFileSync(
        path.join(__dirname, `${shortFormId+prescriber+canceller}-prescription-order.json`),
        LosslessJson.stringify(prescriptionOrderMessage), "utf-8"
      )

      const cancelMessage = generateCancelMessage(prescriptionOrderMessage, 0)
      if (prescriber !== canceller) {
        setResponsiblePartyOnMedicationRequests(cancelMessage, canceller)
      }

      fs.writeFileSync(
        path.join(__dirname, `${shortFormId+prescriber+canceller}-prescription-order-update.json`),
        LosslessJson.stringify(cancelMessage), "utf-8"
      )
    })

  function setIdsAndTimestamps(bundle: fhir.Bundle) {
    bundle.identifier.value = generateResourceId()
    const timeNow = convertMomentToISODateTime(moment.utc())

    const medicationShortFormId = generateShortFormID()
    getMedicationRequests(bundle)
      .forEach(medicationRequest => {
        medicationRequest.groupIdentifier.value = medicationShortFormId
        const extension = getExtensionForUrl(
          medicationRequest.groupIdentifier.extension,
          "https://fhir.nhs.uk/R4/StructureDefinition/Extension-PrescriptionId",
          "MedicationRequest.groupIdentifier.extension"
        ) as fhir.IdentifierExtension
        extension.valueIdentifier.value = generateResourceId()
        medicationRequest.authoredOn = timeNow
      })
    return medicationShortFormId
  }

  test("create a prescription-order message with multiple medicationRequests", () => {
    const newPrescriptionMessage = removeResourcesOfType(originalPrescriptionMessage, "MedicationRequest")
    const medicationNames = ["nystatin", "phosphates", "diclofenac", "water"]
    medicationNames
      .map(medicationName => medicationRequests.get(medicationName))
      .map(medicationRequest => toBundleEntry(medicationRequest))
      .forEach(medicationRequest => newPrescriptionMessage.entry.push(medicationRequest))
    setIdsAndTimestamps(newPrescriptionMessage)

    fs.writeFileSync(
      path.join(__dirname, `multi-prescription-order.json`),
      LosslessJson.stringify(newPrescriptionMessage), "utf-8"
    )

    const cancelMessage = generateCancelMessage(newPrescriptionMessage, 0)

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
      setIdsAndTimestamps(originalPrescriptionMessage)
      fs.writeFileSync(
        path.join(__dirname, `${statusCode}-prescription-order.json`),
        LosslessJson.stringify(originalPrescriptionMessage), "utf-8"
      )

      const cancelMessage = generateCancelMessage(originalPrescriptionMessage, 0, statusCode)
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

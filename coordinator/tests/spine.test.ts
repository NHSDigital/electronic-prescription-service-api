// import {specification} from "./resources/test-resources"
// import {generateResourceId} from "../src/services/translation/cancellation/common"
// import {
//   getMedicationRequests,
//   getMessageHeader,
//   getPractitionerRole
// } from "../src/services/translation/common/getResourcesOfType"
// import * as fs from "fs"
// import path from "path"
// import * as fhir from "../src/models/fhir/fhir-resources"
// import {getExtensionForUrl} from "../src/services/translation/common"
//
// function generateCancelMessage(requestPayload: fhir.Bundle) {
//   const cancelMessage = Object.assign({}, requestPayload)
//   cancelMessage.identifier.value = generateResourceId()
//   const cancelMessageHeader = getMessageHeader(cancelMessage)
//   cancelMessageHeader.eventCoding.code = "prescription-order-update"
//   cancelMessageHeader.eventCoding.display = "Prescription Order Update"
//   const cancelMessageMedicationRequest = getMedicationRequests(cancelMessage)
//   cancelMessageMedicationRequest[0].statusReason = getStatusReason("0001")
//   return cancelMessage
// }
//
// function convertPrescriberToX(nursePrescriptionMessage: fhir.Bundle, x: People) {
//   const prescriptionTypeUrl = "https://fhir.nhs.uk/R4/StructureDefinition/Extension-DM-prescriptionType"
//
//   const prescriptionMessage = Object.assign({}, nursePrescriptionMessage)
//   prescriptionMessage.identifier.value = generateResourceId()
//
//   const medicationRequest = getMedicationRequests(prescriptionMessage)
//   const prescriptionTypeExtension = getExtensionForUrl(
//     medicationRequest[0].extension, prescriptionTypeUrl, ""
//   ) as fhir.CodingExtension
//   prescriptionTypeExtension.valueCoding = prescriptionTypeExtensionInfo[x]
//
//   const practitionerRole = getPractitionerRole(prescriptionMessage)
//   practitionerRole[0].code[0].coding[0] = practitionerRoleCodingInfo[x]
//
//   return prescriptionMessage
// }
//
// enum People {
//   doctor,
//   nurse,
//   pharmacist
// }
//
// const prescriptionTypeExtensionInfo = {
//   doctor: {
//     "system": "https://fhir.nhs.uk/CodeSystem/prescription-type",
//     "code": "1001",
//     "display": "Outpatient Community Prescriber - Medical Prescriber"
//   },
//   nurse: {
//     "system": "https://fhir.nhs.uk/CodeSystem/prescription-type",
//     "code": "1004",
//     "display": "Outpatient Community Prescriber - Nurse Independent/Supplementary prescriber"
//   },
//   pharmacist: {
//     "system": "https://fhir.nhs.uk/CodeSystem/prescription-type",
//     "code": "1008",
//     "display": "Outpatient Community Prescriber - Pharmacist Independent/Supplementary prescriber"
//   }
// }
// const practitionerRoleCodingInfo = {
//   "doctor": {
//     "system": "https://fhir.nhs.uk/R4/CodeSystem/UKCore-SDSJobRoleName",
//     "code": "R8000",
//     "display": "Clinical Practitioner Access Role"
//   },
//   "nurse": {
//     "system": "https://fhir.nhs.uk/R4/CodeSystem/UKCore-SDSJobRoleName",
//     "code": "R8001",
//     "display": "Nurse Access Role"
//   },
//   "pharmacist": {
//     "system": "https://fhir.nhs.uk/R4/CodeSystem/UKCore-SDSJobRoleName",
//     "code": "R8003",
//     "display": "Health Professional Access Role"
//   }
// }
//
// describe("generate prescription-order and prescription-order-update messages", () => {
//   test("^", async () => {
//     const nursePrescriptionMessage = specification[1].fhirMessageSigned
//     nursePrescriptionMessage.identifier.value = generateResourceId()
//     const medicationRequest = getMedicationRequests(nursePrescriptionMessage)
//     medicationRequest[0].groupIdentifier.value = generateShortFormID()
//
//     fs.writeFileSync(
//       path.join(__dirname, "nurse-prescription-order.json"),
//       JSON.stringify(nursePrescriptionMessage), "utf-8"
//     )
//
//     const nurseCancelMessage = generateCancelMessage(nursePrescriptionMessage)
//
//     fs.writeFileSync(
//       path.join(__dirname, "nurse-prescription-order-update.json"),
//       JSON.stringify(nurseCancelMessage), "utf-8"
//     )
//
//     const doctorPrescriptionMessage = convertPrescriberToX(nursePrescriptionMessage, "doctor")
//
//     fs.writeFileSync(
//       path.join(__dirname, "doctor-prescription-order.json"),
//       JSON.stringify(doctorPrescriptionMessage), "utf-8"
//     )
//
//     const pharmacistPrescriptionMessage = convertPrescriberToX(nursePrescriptionMessage, "pharmacist")
//
//     fs.writeFileSync(
//       path.join(__dirname, "pharmacist-prescription-order.json"),
//       JSON.stringify(pharmacistPrescriptionMessage), "utf-8"
//     )
//   })
// })
//
// function getStatusReason(statusCode: string) {
//   return {
//     "coding": [
//       {
//         "system": "https://fhir.nhs.uk/CodeSystem/medicationrequest-status-reason",
//         "code": statusCode,
//         "display": statusCode === "0001" ? "Prescribing Error" : ""
//       }
//     ]
//   }
// }
//
// function generateShortFormID() {
//   const _PRESC_CHECKDIGIT_VALUES = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ+"
//   const hexString = (generateResourceId()).replace(/-/g, "").toUpperCase()
//   let prescriptionID = hexString.substring(0, 6) + "-" + "A99968" + "-" + hexString.substring(12, 18)
//   const prscID = prescriptionID.replace("-", "")
//   const prscIDLength = prscID.length
//   let runningTotal = 0
//   let checkValue
//   prscID.split("").forEach((character, index) => {
//     runningTotal = runningTotal + parseInt(character, 36) * (2 ** (prscIDLength - index))
//   })
//   checkValue = (38 - runningTotal % 37) % 37
//   checkValue = _PRESC_CHECKDIGIT_VALUES.substring(checkValue, checkValue+1)
//   prescriptionID += checkValue
//   return prescriptionID
// }
//
// // function createAuthHeader(authToken: string) {
// //   return {
// //     "Authorization": `Bearer ${authToken}`,
// //     "Content-Type": "application/json"
// //   }
// // }
// // const intToken = "RVx0Lc1NysOoytQwHDua4MOQNaFq"
// // const intSpineEndpoint = "https://internal-dev.api.service.nhs.uk/electronic-prescriptions/$process-message"
// // const response = await axios.post<string>(intSpineEndpoint, requestPayload, {
// //   headers: createAuthHeader(intToken),
// //   validateStatus: (status) => true
// // })

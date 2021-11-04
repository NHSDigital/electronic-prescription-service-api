import {
  getMedicationDispenseResources,
  getMedicationRequestResources,
  getPatientResources
} from "../../../src/fhir/bundleResourceFinder"
import {createClaim} from "../../../src/components/claim/createDispenseClaim"
import {toStaticProductInfo} from "../../../src/pages/claimPage"
import * as fhir from "fhir/r4"
import {getClaimSequenceIdentifierExtension} from "../../../src/fhir/customExtensions"
import {readMessage} from "./messages/messages"

const prescriptionOrder = readMessage("prescriptionOrder.json")
const dispenseNotification = readMessage("dispenseNotification.json")
const patient = getPatientResources(prescriptionOrder)[0]
const medicationRequests = getMedicationRequestResources(prescriptionOrder)
const medicationDispenses = getMedicationDispenseResources(dispenseNotification)

test("Produces expected result", () => {
  const result = createClaim(patient, medicationRequests, medicationDispenses, {
    products: medicationDispenses.map(medicationDispense => ({
      ...toStaticProductInfo(medicationDispense),
      patientPaid: true,
      endorsements: [{
        code: "IP",
        supportingInfo: "£210.91,100ml,Specials Ltd,Lic12345678,BN12345678"
      }]
    })),
    exemption: {
      code: "0005",
      evidenceSeen: true
    }
  })
  replaceNonDeterministicValues(result)
  expect(result).toMatchSnapshot()
})

function replaceNonDeterministicValues(result: fhir.Claim) {
  result.created = "2021-11-01T14:35:00.000Z"
  result.identifier[0].value = "fb51061d-3808-4551-984d-4b25924cd15a"
  result.item
    .flatMap(item => item.detail)
    .map(detail => getClaimSequenceIdentifierExtension(detail.extension))
    .forEach(extension => extension.valueIdentifier.value = "fb51061d-3808-4551-984d-4b25924cd15a")
}

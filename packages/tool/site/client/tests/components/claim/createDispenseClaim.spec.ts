import {
  getMedicationDispenseResources,
  getMedicationRequestResources,
  getOrganizationResources,
  getPatientResources
} from "../../../src/fhir/bundleResourceFinder"
import {createClaim} from "../../../src/components/claim/createDispenseClaim"
import * as fhir from "fhir/r4"
import {getClaimSequenceIdentifierExtension} from "../../../src/fhir/customExtensions"
import {readBundleFromFile} from "../../messages"
import {createStaticProductInfoArray} from "../../../src/pages/claimPage"
import {ClaimFormValues} from "../../../src/components/claim/claimForm"
import {PRESCRIPTION_CHARGE_EXEMPTION_CODE_NONE} from "../../../src/fhir/reference-data/valueSets"

const prescriptionOrder = readBundleFromFile("prescriptionOrder.json")
const dispenseNotification = readBundleFromFile("dispenseNotification.json")
const patient = getPatientResources(prescriptionOrder)[0]
const medicationRequests = getMedicationRequestResources(prescriptionOrder)
const medicationDispenses = getMedicationDispenseResources(dispenseNotification)
const dispensingOrganization = getOrganizationResources(dispenseNotification)[0]
const prescriptionDetails = {patient, medicationRequests, medicationDispenses, dispensingOrganization}

test("Produces expected result when endorsement not present", () => {
  const staticProductInfoArray = createStaticProductInfoArray(medicationDispenses)
  const claimFormValues: ClaimFormValues = {
    products: staticProductInfoArray.map(staticProductInfo => ({
      ...staticProductInfo,
      patientPaid: true,
      endorsements: []
    })),
    exemption: {
      code: PRESCRIPTION_CHARGE_EXEMPTION_CODE_NONE,
      evidenceSeen: false
    }
  }
  const result = createClaim(prescriptionDetails, claimFormValues)
  replaceNonDeterministicValues(result)
  expect(result).toMatchSnapshot()
})

test("Produces expected result when single endorsement present", () => {
  const staticProductInfoArray = createStaticProductInfoArray(medicationDispenses)
  const claimFormValues: ClaimFormValues = {
    products: staticProductInfoArray.map(staticProductInfo => ({
      ...staticProductInfo,
      patientPaid: true,
      endorsements: [{
        code: "IP",
        supportingInfo: "£210.91,100ml,Specials Ltd,Lic12345678,BN12345678"
      }]
    })),
    exemption: {
      code: PRESCRIPTION_CHARGE_EXEMPTION_CODE_NONE,
      evidenceSeen: false
    }
  }
  const result = createClaim(prescriptionDetails, claimFormValues)
  replaceNonDeterministicValues(result)
  expect(result).toMatchSnapshot()
})

test("Produces expected result when multiple endorsements present", () => {
  const staticProductInfoArray = createStaticProductInfoArray(medicationDispenses)
  const claimFormValues: ClaimFormValues = {
    products: staticProductInfoArray.map(staticProductInfo => ({
      ...staticProductInfo,
      patientPaid: true,
      endorsements: [
        {
          code: "BB",
          supportingInfo: ""
        },
        {
          code: "IP",
          supportingInfo: "£210.91,100ml,Specials Ltd,Lic12345678,BN12345678"
        }
      ]
    })),
    exemption: {
      code: PRESCRIPTION_CHARGE_EXEMPTION_CODE_NONE,
      evidenceSeen: false
    }
  }
  const result = createClaim(prescriptionDetails, claimFormValues)
  replaceNonDeterministicValues(result)
  expect(result).toMatchSnapshot()
})

test("Produces expected result when non-default exemption code selected", () => {
  const staticProductInfoArray = createStaticProductInfoArray(medicationDispenses)
  const claimFormValues: ClaimFormValues = {
    products: staticProductInfoArray.map(staticProductInfo => ({
      ...staticProductInfo,
      patientPaid: false,
      endorsements: []
    })),
    exemption: {
      code: "0005",
      evidenceSeen: true
    }
  }
  const result = createClaim(prescriptionDetails, claimFormValues)
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

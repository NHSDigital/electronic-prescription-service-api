import {convertParentPrescription} from "../../../src/services/translation/request/prescription/parent-prescription"
import {createInnerBundle} from "../../../src/services/translation/response/release/release-response"
import * as TestResources from "../../resources/test-resources"
import {getResourcesOfType} from "../../../src/services/translation/common/getResourcesOfType"
import * as fhir from "../../../src/models/fhir"
import * as hl7V3 from "../../../src/models/hl7-v3"
import * as LosslessJson from "lossless-json"
import * as uuid from "uuid"
import {toArray} from "../../../src/services/translation/common"

describe("translations are reversible", () => {
  const bundle = TestResources.specification[0].fhirMessageSigned
  const parentPrescription = convertParentPrescription(bundle)
  ensureLineItemStatus(parentPrescription)
  const originalBundle = JSON.parse(LosslessJson.stringify(bundle))
  const translatedBundle = createInnerBundle(parentPrescription, uuid.v4())

  test.skip.each([
    "MessageHeader",
    "Patient",
    "MedicationRequest",
    "CommunicationRequest",
    "List",
    "PractitionerRole",
    "Practitioner",
    "HealthcareService",
    "Location",
    "Organization",
    "Provenance"
  ])("%s", (resourceType: string) => {
    const original = getResourcesOfType(originalBundle, resourceType)
    removeIds(...original)
    const translated = getResourcesOfType(translatedBundle, resourceType)
    removeIds(...translated)
    expect(original.length).toBeGreaterThan(0)
    expect(translated).toEqual(original)
  })
})

function removeIds(...resource: Array<fhir.Resource>) {
  resource.forEach(resource => resource.id = undefined)
}

function ensureLineItemStatus(parentPrescription: hl7V3.ParentPrescription) {
  const prescription = parentPrescription.pertinentInformation1.pertinentPrescription
  const lineItems = toArray(prescription.pertinentInformation2).map(pi2 => pi2.pertinentLineItem)
  lineItems.forEach(lineItem => {
    const itemStatus = new hl7V3.ItemStatus(hl7V3.ItemStatusCode.TO_BE_DISPENSED)
    lineItem.pertinentInformation4 = new hl7V3.LineItemPertinentInformation4(itemStatus)
  })
}

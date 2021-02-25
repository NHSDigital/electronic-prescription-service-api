import {convertParentPrescription} from "../../../src/services/translation/request/prescription/parent-prescription"
import {createInnerBundle} from "../../../src/services/translation/response/release/release-response"
import * as TestResources from "../../resources/test-resources"
import {getResourcesOfType} from "../../../src/services/translation/common/getResourcesOfType"
import * as fhir from "../../../src/models/fhir"
import * as LosslessJson from "lossless-json"
import * as uuid from "uuid"

describe("translations are reversible", () => {
  const bundle = TestResources.specification[0].fhirMessageSigned
  const parentPrescription = convertParentPrescription(bundle)
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
    expect(original).toEqual(translated)
  })
})

function removeIds(...resource: Array<fhir.Resource>) {
  resource.forEach(resource => resource.id = undefined)
}

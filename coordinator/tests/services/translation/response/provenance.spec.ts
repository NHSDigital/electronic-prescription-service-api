import * as helpers from "../../../resources/test-helpers"
import * as TestResources from "../../../resources/test-resources"
import {fhir} from "@models"
import * as common from "../../../../src/services/translation/common/getResourcesOfType"
import {convertAuthor} from "../../../../src/services/translation/request/practitioner"
import {convertSignatureTextToProvenance} from "../../../../src/services/translation/response/provenance"

let bundle: fhir.Bundle
let firstMedicationRequest: fhir.MedicationRequest

describe("Provenance", () => {
  beforeEach(() => {
    bundle = helpers.clone(TestResources.examplePrescription1.fhirMessageSigned)
    firstMedicationRequest = common.getMedicationRequests(bundle)[0]
  })

  test("v3 to FHIR provenance creation", () => {
    const author = convertAuthor(bundle, firstMedicationRequest)

    const resourceIds = bundle.entry.map(entry => entry.resource.id)

    const provenance = convertSignatureTextToProvenance(author, "testAuthorId", resourceIds)

    expect(provenance.target).toBeDefined()
    expect(provenance.agent).toBeDefined()
    expect(provenance.signature).toHaveLength(1)
    expect(provenance.signature[0].data).toBeDefined()
    expect(provenance.signature[0].who).toBeDefined()
    expect(provenance.signature[0].when).toBeDefined()
    expect(provenance.signature[0].type).toBeDefined()
    expect(provenance.recorded).toBeDefined()
  })
})

import * as helpers from "../../../resources/test-helpers"
import * as TestResources from "../../../resources/test-resources"
import {fhir} from "@models"
import {convertAuthor} from "../../../../src/services/translation/request/practitioner"
import {convertSignatureTextToProvenance} from "../../../../src/services/translation/response/provenance"
import {getMedicationRequests, getProvenances} from "../../../../src/services/translation/common/getResourcesOfType"
import {readXml, writeXmlStringCanonicalized} from "../../../../src/services/serialisation/xml"

describe("Provenance", () => {
  const bundle = helpers.clone(TestResources.specification[0].fhirMessageSigned)
  const firstMedicationRequest = getMedicationRequests(bundle)[0]
  const provenanceBefore = getProvenances(bundle)[0]
  const author = convertAuthor(bundle, firstMedicationRequest)
  const resourceIds = bundle.entry.map((entry) => entry.resource.id)
  const provenanceAfter = convertSignatureTextToProvenance(author, "testAuthorId", resourceIds)

  test("expected fields are populated", () => {
    expect(provenanceAfter.target).toBeDefined()
    expect(provenanceAfter.agent).toBeDefined()
    expect(provenanceAfter.signature).toHaveLength(1)
    expect(provenanceAfter.signature[0].data).toBeDefined()
    expect(provenanceAfter.signature[0].who).toBeDefined()
    expect(provenanceAfter.signature[0].when).toBeDefined()
    expect(provenanceAfter.signature[0].type).toBeDefined()
    expect(provenanceAfter.recorded).toBeDefined()
  })

  test("signature data matches once canonicalized", () => {
    const canonicalizedSignatureBefore = getCanonicalizedSignature(provenanceBefore)
    const canonicalizedSignatureAfter = getCanonicalizedSignature(provenanceAfter)
    expect(canonicalizedSignatureAfter).toEqual(canonicalizedSignatureBefore)
  })
})

function getCanonicalizedSignature(provenance: fhir.Provenance) {
  const signatureData = provenance.signature[0].data
  const decodedSignatureData = Buffer.from(signatureData, "base64").toString("utf-8")
  const deserializedXml = readXml(decodedSignatureData)
  return writeXmlStringCanonicalized(deserializedXml)
}

import * as XmlJs from "xml-js"
import {writeXmlStringPretty} from "../../src/services/translation/xml"
import * as LosslessJson from "lossless-json"
import * as fhir from "../../src/model/fhir-resources"

export function clone<T>(input: T): T {
  return LosslessJson.parse(LosslessJson.stringify(input))
}

export function xmlTest(actualRoot: XmlJs.ElementCompact, expectedRoot: XmlJs.ElementCompact): () => void {
  return () => {
    const actualXmlStr = writeXmlStringPretty(actualRoot)
    const expectedXmlStr = writeXmlStringPretty(expectedRoot)
    expect(actualXmlStr).toEqual(expectedXmlStr)
  }
}

export function addEmptyCommunicationRequestToBundle(bundle: fhir.Bundle): void {
  const communicationRequest: fhir.CommunicationRequest = {
    resourceType: "CommunicationRequest",
    subject: undefined,
    payload: []}
  bundle.entry.push({resource: communicationRequest})
}

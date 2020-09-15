import * as XmlJs from "xml-js"
import {writeXmlStringPretty} from "../../src/services/serialisation/xml"
import * as LosslessJson from "lossless-json"
import * as fhir from "../../src/models/fhir/fhir-resources"

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

declare global {
  interface Array<T> {
    remove(elem: T): void;
  }
}

if (!Array.prototype.remove) {
  Array.prototype.remove = function<T>(this: Array<T>, elem: T): void {
    const index = this.indexOf(elem)
    this.splice(index, 1)
  }
}

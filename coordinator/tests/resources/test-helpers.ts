import * as XmlJs from "xml-js"
import {sortAttributes} from "../../src/services/translation/xml"
import * as LosslessJson from "lossless-json"
import * as fhir from "../../src/model/fhir-resources"

export function clone<T>(input: T): T {
  return LosslessJson.parse(LosslessJson.stringify(input))
}

export function xmlTest(actualRoot: XmlJs.ElementCompact, expectedRoot: XmlJs.ElementCompact): () => void {
  return () => {
    const options = {
      compact: true,
      spaces: 4,
      attributesFn: sortAttributes
    } as unknown as XmlJs.Options.JS2XML
    const actualXmlStr = XmlJs.js2xml(actualRoot, options)
    const expectedXmlStr = XmlJs.js2xml(expectedRoot, options)
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
    removeAll(elems: T[]): void;
  }
}

if (!Array.prototype.removeAll) {
  Array.prototype.removeAll = function<T>(this: T[], elems: T[]): void {
    elems.reverse().forEach(e => {
      const index = this.indexOf(e)
      this.splice(index, 1)
    })
  }
}

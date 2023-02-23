import * as XmlJs from "xml-js"
import {writeXmlStringPretty} from "../../src/services/serialisation/xml"
import * as LosslessJson from "lossless-json"
import * as uuid from "uuid"
import {fhir} from "@models"
import path from "path"
import fs from "fs"
import {
  ParentPrescription,
  PrescriptionReleaseResponse,
  PrescriptionReleaseResponseComponent
} from "../../../models/hl7-v3"

export function clone<T>(input: T): T {
  return LosslessJson.parse(LosslessJson.stringify(input)) as T
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
    status: "unknown",
    subject: undefined,
    payload: [],
    requester: undefined,
    recipient: undefined
  }
  bundle.entry.push({resource: communicationRequest})
}

export function addEmptyListToBundle(bundle: fhir.Bundle): void {
  const list: fhir.List = {
    resourceType: "List",
    id: uuid.v4(),
    status: "current",
    mode: "snapshot",
    entry: []
  }
  bundle.entry.push({
    resource: list,
    fullUrl: `urn:uuid:${list.id}`
  })
}

export function addEmptyHealthcareServiceToBundle(bundle: fhir.Bundle): void {
  const healthcareService: fhir.HealthcareService = {resourceType: "HealthcareService"}
  bundle.entry.push({resource: healthcareService})
}

export function addEmptyLocationToBundle(bundle: fhir.Bundle): void {
  const location: fhir.Location = {resourceType: "Location"}
  bundle.entry.push({resource: location})
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

export const setSubcaccCertEnvVar = (filepath: string): void => {
  if (process.env.SUBCACC_CERT) {
    process.env.SUBCACC_CERT = process.env.SUBCACC_CERT.concat(`,${fs.readFileSync(path.join(__dirname, filepath))})`)
  } else {
    process.env.SUBCACC_CERT = fs.readFileSync(path.join(__dirname, filepath)).toString()
  }
}

export function getParentPrescription(prescriptionReleaseResponse: PrescriptionReleaseResponse) : ParentPrescription {
  const component = prescriptionReleaseResponse.component as PrescriptionReleaseResponseComponent
  return component.ParentPrescription
}

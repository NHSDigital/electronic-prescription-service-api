import * as XmlJs from "xml-js"
import {ElementCompact} from "xml-js"
import * as fs from "fs"
import * as path from "path"
import {Bundle, OperationOutcome, Parameters} from "./fhir-resources"
import * as LosslessJson from "lossless-json"

export class ExamplePrescription {
  description: string
  fhirMessageUnsigned: Bundle
  fhirMessageSigned: Bundle
  fhirMessageCancel: Bundle
  fhirMessageDigest: Parameters
  hl7V3Message: ElementCompact
  hl7V3MessageCancel: ElementCompact

  hl7V3SignatureFragments?: ElementCompact
  hl7V3FragmentsCanonicalized?: string

  constructor(description: string, location: string) {
    const fhirMessageUnsignedStr = fs.readFileSync(path.join(__dirname, location, "PrepareRequest-FhirMessageUnsigned.json"), "utf-8")
    const fhirMessageSignedStr = fs.readFileSync(path.join(__dirname, location, "SendRequest-FhirMessageSigned.json"), "utf-8")
    const fhirMessageDigestStr = fs.readFileSync(path.join(__dirname, location, "PrepareResponse-FhirMessageDigest.json"), "utf-8")
    const hl7V3MessageStr = fs.readFileSync(path.join(__dirname, location, "ConvertResponse-Hl7V3Message.xml"), "utf-8")

    this.description = description
    this.fhirMessageUnsigned = LosslessJson.parse(fhirMessageUnsignedStr)
    this.fhirMessageSigned = LosslessJson.parse(fhirMessageSignedStr)
    this.fhirMessageDigest = LosslessJson.parse(fhirMessageDigestStr)
    this.hl7V3Message = XmlJs.xml2js(hl7V3MessageStr, {compact: true})

    const fhirMessageCancelPath = path.join(__dirname, location, "CancelRequest-FhirMessage.json")
    if (fs.existsSync(fhirMessageCancelPath)) {
      const fhirMessageCancelStr = fs.readFileSync(fhirMessageCancelPath, "utf-8")
      this.fhirMessageCancel = LosslessJson.parse(fhirMessageCancelStr)
    }

    const hl7V3MessageCancelPath = path.join(__dirname, location, "CancelResponse-Hl7V3Message.xml")
    if (fs.existsSync(hl7V3MessageCancelPath)) {
      const hl7V3MessageCancelStr = fs.readFileSync(hl7V3MessageCancelPath, "utf-8")
      this.hl7V3MessageCancel = XmlJs.xml2js(hl7V3MessageCancelStr, {compact: true})
    }

  }
}

export const examplePrescription1 = new ExamplePrescription("repeat dispensing", "parent-prescription-1")

const hl7V3SignatureFragments1Str = fs.readFileSync(path.join(__dirname, "./parent-prescription-1/PrepareIntermediate-Hl7V3SignatureFragments.xml"), "utf8")
const hl7V3SignatureFragments1 = XmlJs.xml2js(hl7V3SignatureFragments1Str, {compact: true}) as ElementCompact
examplePrescription1.hl7V3SignatureFragments = hl7V3SignatureFragments1

const hl7V3SignatureFragmentsCanonicalized1 = fs.readFileSync(path.join(__dirname, "./parent-prescription-1/PrepareIntermediate-Hl7V3SignatureFragmentsCanonicalized.txt"), "utf8")
examplePrescription1.hl7V3FragmentsCanonicalized = hl7V3SignatureFragmentsCanonicalized1.replace("\n", "")

export const examplePrescription2 = new ExamplePrescription("acute, nominated pharmacy", "parent-prescription-2")

export const examplePrescription3 = new ExamplePrescription("homecare", "parent-prescription-3")

//export const examplePrescription4 = new ExamplePrescription("homecare repeat dispensing", "parent-prescription-4")

export const specification = [
  examplePrescription1,
  examplePrescription2,
  examplePrescription3
  //examplePrescription4
]

export class ConvertPrescriptionSpec {
  request: Bundle
  response: ElementCompact

  constructor(request: Bundle, response: ElementCompact) {
    this.request = request
    this.response = response
  }
}

export class PreparePrescriptionSpec {
  request: Bundle
  response: Parameters

  constructor(request: Bundle, response: Parameters) {
    this.request = request
    this.response = response
  }
}

export class SendPrescriptionSpec {
  description: string
  request: Bundle

  constructor(baseLocation: string, location: string, requestFile: string) {
    const requestString = fs.readFileSync(path.join(__dirname, baseLocation, location, requestFile), "utf-8")

    const requestJson = LosslessJson.parse(requestString)

     /* eslint-disable-next-line no-useless-escape */
    this.description = location.replace("/\//g", " ")
    this.request = requestJson
  }
}

export class CancelPrescriptionSpec {
  request: Bundle
  response: OperationOutcome

  constructor(request: Bundle, response: OperationOutcome) {
    this.request = request
    this.response = response
  }
}

export const sendSpec1 = new SendPrescriptionSpec(
  "./parent-prescription", 
  "secondary-care/homecare/acute/no-nominated-pharmacy",
  "SendRequest-Success-1.json")

export const sendSpecs = [
  sendSpec1
]

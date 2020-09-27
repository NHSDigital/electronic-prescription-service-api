import * as XmlJs from "xml-js"
import { ElementCompact } from "xml-js"
import * as fs from "fs"
import * as path from "path"
import { Bundle, Parameter } from "./fhir-resources"
import * as LosslessJson from "lossless-json"
import * as uuid from "uuid"
import { ConvertSpec } from "./test-convert-specs"

class ExamplePrescription {
  description: string
  fhirMessageUnsigned: Bundle
  fhirMessageSigned: Bundle
  fhirMessageCancel: Bundle
  fhirMessageDigest: Parameter
  hl7V3Message: ElementCompact
  hl7V3MessageSignedStr: string
  hl7V3MessageUnsignedStr: string
  hl7V3MessageSignedMatcher: string
  hl7V3MessageUnsignedMatcher: string
  hl7V3MessageCancel: ElementCompact
  hl7V3MessageCancelStr: string
  hl7V3MessageCancelMatcher: string

  constructor(description: string, location: string) {
    const fhirMessageUnsignedStr = fs.readFileSync(path.join(__dirname, location, "PrepareRequest-FhirMessageUnsigned.json"), "utf-8")
    const fhirMessageSignedStr = fs.readFileSync(path.join(__dirname, location, "SendRequest-FhirMessageSigned.json"), "utf-8")
    const fhirMessageDigestStr = fs.readFileSync(path.join(__dirname, location, "PrepareResponse-FhirMessageDigest.json"), "utf-8")
    const hl7V3MessageStr = fs.readFileSync(path.join(__dirname, location, "ConvertResponse-SignedHl7V3Message.xml"), "utf-8")

    this.description = description
    this.fhirMessageUnsigned = LosslessJson.parse(fhirMessageUnsignedStr)
    this.fhirMessageSigned = LosslessJson.parse(fhirMessageSignedStr)
    this.fhirMessageDigest = LosslessJson.parse(fhirMessageDigestStr)
    this.hl7V3Message = XmlJs.xml2js(hl7V3MessageStr, { compact: true })
    
    const convertUnsignedSpec = new ConvertSpec(
      location,
      ".",
      "PrepareRequest-FhirMessageUnsigned.json",
      "ConvertResponse-UnsignedHl7V3Message.xml")
    this.hl7V3MessageUnsignedStr = convertUnsignedSpec.response
    this.hl7V3MessageUnsignedMatcher = convertUnsignedSpec.responseMatcher

    const convertSignedSpec = new ConvertSpec(
      location,
      ".",
      "SendRequest-FhirMessageSigned.json",
      "ConvertResponse-SignedHl7V3Message.xml")
    this.hl7V3MessageSignedStr = convertSignedSpec.response
    this.hl7V3MessageSignedMatcher = convertSignedSpec.responseMatcher

    this.fhirMessageUnsigned.identifier.value = uuid.v4()
    this.fhirMessageSigned.identifier.value = uuid.v4()

    const fhirMessageCancelPath = path.join(__dirname, location, "CancelRequest-FhirMessage.json")
    if (fs.existsSync(fhirMessageCancelPath)) {
      const fhirMessageCancelStr = fs.readFileSync(fhirMessageCancelPath, "utf-8")
      this.fhirMessageCancel = LosslessJson.parse(fhirMessageCancelStr)
    }

    const hl7V3MessageCancelPath = path.join(__dirname, location, "CancelResponse-Hl7V3Message.xml")
    if (fs.existsSync(hl7V3MessageCancelPath)) {
      const hl7V3MessageCancelStr = fs.readFileSync(hl7V3MessageCancelPath, "utf-8")
      this.hl7V3MessageCancel = XmlJs.xml2js(hl7V3MessageCancelStr, { compact: true })
      const cancelConvertSpec = new ConvertSpec(
        location,
        ".",
        "CancelRequest-FhirMessage.json",
        "ConvertResponse-SignedHl7V3Message.xml")
      this.hl7V3MessageCancelStr = cancelConvertSpec.response
      this.hl7V3MessageCancelMatcher = cancelConvertSpec.responseMatcher
    }

  }
}

const examplePrescription1 = new ExamplePrescription("repeat dispensing", "parent-prescription-1")

const examplePrescription2 = new ExamplePrescription("acute, nominated pharmacy", "parent-prescription-2")

const examplePrescription3 = new ExamplePrescription("homecare", "parent-prescription-3")

const examplePrescription4 = new ExamplePrescription("homecare repeat dispensing", "parent-prescription-4")

export const specificationSpecs = [
  examplePrescription1,
  examplePrescription2,
  examplePrescription3,
  examplePrescription4
]

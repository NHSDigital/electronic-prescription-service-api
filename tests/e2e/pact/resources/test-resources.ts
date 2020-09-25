/* eslint-disable */ 
import * as XmlJs from "xml-js"
import {ElementCompact} from "xml-js"
import * as fs from "fs"
import * as path from "path"
import {Bundle, Parameters} from "./fhir-resources"
import * as LosslessJson from "lossless-json"
import * as uuid from "uuid"

class ExamplePrescription {
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
      this.hl7V3MessageCancel = XmlJs.xml2js(hl7V3MessageCancelStr, {compact: true})
    }

  }
}

const examplePrescription1 = new ExamplePrescription("repeat dispensing", "parent-prescription-1")

const hl7V3SignatureFragments1Str = fs.readFileSync(path.join(__dirname, "./parent-prescription-1/PrepareIntermediate-Hl7V3SignatureFragments.xml"), "utf8")
const hl7V3SignatureFragments1 = XmlJs.xml2js(hl7V3SignatureFragments1Str, {compact: true}) as ElementCompact
examplePrescription1.hl7V3SignatureFragments = hl7V3SignatureFragments1

const hl7V3SignatureFragmentsCanonicalized1 = fs.readFileSync(path.join(__dirname, "./parent-prescription-1/PrepareIntermediate-Hl7V3SignatureFragmentsCanonicalized.txt"), "utf8")
examplePrescription1.hl7V3FragmentsCanonicalized = hl7V3SignatureFragmentsCanonicalized1.replace("\n", "")

const examplePrescription2 = new ExamplePrescription("acute, nominated pharmacy", "parent-prescription-2")

const examplePrescription3 = new ExamplePrescription("homecare", "parent-prescription-3")

//export const examplePrescription4 = new ExamplePrescription("homecare repeat dispensing", "parent-prescription-4")

const specification = [
  examplePrescription1,
  examplePrescription2,
  examplePrescription3
  //examplePrescription4
]

class ConvertPrescriptionSpec {
  description: string
  request: Bundle
  response: string
  responseMatcher: string

  constructor(baseLocation: string, location: string, requestFile: string, responseFile: string) {
    const requestString = fs.readFileSync(path.join(__dirname, baseLocation, location, requestFile), "utf-8")
    const requestJson = LosslessJson.parse(requestString)

    const responseXmlString = fs.readFileSync(path.join(__dirname, baseLocation, location, responseFile), "utf-8")

    const responseMatcher = responseXmlString
      .replace(/<creationTime value=\"[0-9]*\"\/>/g, "<creationTime value=\"[0-9]*\"\/>") // replace creation time with regex pattern
      .replace(/\"/g, "\\\"")   // prepend quotes with backslash
      .replace(/\//g, "\\/")    // prepend forward slash with backslash
      .replace(/\./g, "\\.")    // prepend fullstop with backslash
      .replace(/\?/g, "\\?")    // prepend question mark with backslash
      .replace(/\+/g, "\\+")    // prepend plus with backslash
      .replace(/\r\n/g, "\r\n") // replace carriage returns
      .replace(/\t/g, "    ")   // replace tabs with 4 spaces
      .replace(/\(/g, "\\(")    // prepend opening bracket with backslash 
      .replace(/\)/g, "\\)")    // prepend closing bracket with backslash

    //fs.writeFileSync(path.join(__dirname, "response.txt"), responseXmlString)
    //fs.writeFileSync(path.join(__dirname, "responseMatcher.txt"), responseMatcher)

    //const responseTest = fs.readFileSync(path.join(__dirname, "response.txt"), "utf-8")
    //const responseMatcherTest = fs.readFileSync(path.join(__dirname, "responseMatcher.txt"), "utf-8")

    this.description = location
    this.request = requestJson
    this.response = responseXmlString
    this.responseMatcher = responseMatcher
  }
}

class SendPrescriptionSpec {
  description: string
  request: Bundle

  constructor(baseLocation: string, location: string, requestFile: string) {
    const requestString = fs.readFileSync(path.join(__dirname, baseLocation, location, requestFile), "utf-8")

    const requestJson = LosslessJson.parse(requestString)

    this.description = location
    this.request = requestJson
  }
}

const sendSpec1 = new SendPrescriptionSpec(
  "./parent-prescription", 
  "secondary-care/homecare/acute/no-nominated-pharmacy",
  "SendRequest-Success-1.json")

const convertSpec1 = new ConvertPrescriptionSpec(
  "./parent-prescription", 
  "secondary-care/homecare/acute/no-nominated-pharmacy",
  "SendRequest-Success-1.json",
  "ConvertResponse-Success-1.xml")

const convertSpecs = [
  convertSpec1
]

const sendSpecs = [
  sendSpec1
]

export const prepareCases = [
  ...specification.map(example => [example.description, example.fhirMessageUnsigned, example.fhirMessageDigest])
]

export const convertCases = [
  //...TestResources.specification.map(example => [`unsigned ${example.description}`, example.fhirMessageUnsigned]),
  //...TestResources.specification.map(example => [`signed ${example.description}`, example.fhirMessageSigned]),
  //...TestResources.specification.filter(example => example.fhirMessageCancel).map(example => [`cancel ${example.description}`, example.fhirMessageCancel]),
  ...convertSpecs.map(spec => [spec.description, spec.request, spec.response, spec.responseMatcher])
]

export const sendCases = [
  //...TestResources.specification.map(example => [example.description, example.fhirMessageSigned]),
  //...TestResources.specification.filter(example => example.fhirMessageCancel).map(example => [`cancel ${example.description}`, example.fhirMessageCancel]),
  ...sendSpecs.map(spec => [spec.description, spec.request])
]
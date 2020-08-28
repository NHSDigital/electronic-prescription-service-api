import * as XmlJs from "xml-js"
import * as fs from "fs"
import * as path from "path"
import {ParentPrescription} from "../../src/model/hl7-v3-prescriptions"
import {Bundle, Parameters} from "../../src/model/fhir-resources"
import {ElementCompact} from "xml-js"
import * as LosslessJson from "lossless-json"

const fhirMessageUnsigned1Str = fs.readFileSync(path.join(__dirname, "./parent-prescription-1/PrepareRequest-FhirMessageUnsigned.json"), "utf8")
const fhirMessageSigned1Str = fs.readFileSync(path.join(__dirname, "./parent-prescription-1/SendRequest-FhirMessageSigned.json"), "utf8")
const hl7V3Message1Str = fs.readFileSync(path.join(__dirname, "./parent-prescription-1/ConvertResponse-Hl7V3Message.xml"), "utf8")
const hl7V3SignatureFragments1Str = fs.readFileSync(path.join(__dirname, "./parent-prescription-1/PrepareIntermediate-Hl7V3SignatureFragments.xml"), "utf8")
const hl7V3SignatureFragmentsCanonicalized1 = fs.readFileSync(path.join(__dirname, "./parent-prescription-1/PrepareIntermediate-Hl7V3SignatureFragmentsCanonicalized.txt"), "utf8")
const fhirMessageDigest1Str = fs.readFileSync(path.join(__dirname, "./parent-prescription-1/PrepareResponse-FhirMessageDigest.json"), "utf8")


const fhirMessageUnsigned1 = LosslessJson.parse(fhirMessageUnsigned1Str) as Bundle
const fhirMessageSigned1 = LosslessJson.parse(fhirMessageSigned1Str) as Bundle
const hl7V3Message1 = XmlJs.xml2js(hl7V3Message1Str, {compact: true}) as ElementCompact
const hl7V3SignatureFragments1 = XmlJs.xml2js(hl7V3SignatureFragments1Str, {compact: true}) as ElementCompact
const fhirMessageDigest1 = LosslessJson.parse(fhirMessageDigest1Str) as Parameters


export const examplePrescription1 = {
  fhirMessageUnsigned: fhirMessageUnsigned1,
  fhirMessageSigned: fhirMessageSigned1,
  hl7V3Message: hl7V3Message1,
  hl7V3ParentPrescription: hl7V3Message1.PORX_IN020101SM31.ControlActEvent.subject.ParentPrescription as ParentPrescription,
  hl7V3SignatureFragments: hl7V3SignatureFragments1,
  hl7V3FragmentsCanonicalized: hl7V3SignatureFragmentsCanonicalized1.replace("\n", ""),
  fhirMessageDigest: fhirMessageDigest1
}

const fhirMessageUnsigned2Str = fs.readFileSync(path.join(__dirname, "./parent-prescription-2/PrepareRequest-FhirMessageUnsigned.json"), "utf8")
const fhirMessageSigned2Str = fs.readFileSync(path.join(__dirname, "./parent-prescription-2/SendRequest-FhirMessageSigned.json"), "utf8")
const hl7V3Message2Str = fs.readFileSync(path.join(__dirname, "./parent-prescription-2/ConvertResponse-Hl7V3Message.xml"), "utf8")

const fhirMessageUnsigned2 = LosslessJson.parse(fhirMessageUnsigned2Str) as Bundle
const fhirMessageSigned2 = LosslessJson.parse(fhirMessageSigned2Str) as Bundle
const hl7V3Message2 = XmlJs.xml2js(hl7V3Message2Str, {compact: true}) as ElementCompact

export const examplePrescription2 = {
  fhirMessageUnsigned: fhirMessageUnsigned2,
  fhirMessageSigned: fhirMessageSigned2,
  hl7V3Message: hl7V3Message2,
  hl7V3ParentPrescription: hl7V3Message2.PORX_IN020101SM31.ControlActEvent.subject.ParentPrescription as ParentPrescription
}

const fhirMessageUnsignedHomecareStr = fs.readFileSync(path.join(__dirname, "./parent-prescription-3/PrepareRequest-FhirMessageUnsigned.json"), "utf8")
const fhirMessageUnsignedHomecare = LosslessJson.parse(fhirMessageUnsignedHomecareStr)

export const examplePrescription3 = {
  fhirMessageUnsignedHomecare: fhirMessageUnsignedHomecare
}

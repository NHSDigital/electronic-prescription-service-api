import * as XmlJs from 'xml-js'
import * as fs from 'fs'
import * as path from "path"
import {ParentPrescription} from "../../src/services/hl7-v3-prescriptions";
import {Bundle, Parameters} from "../../src/services/fhir-resources";
import {ElementCompact} from "xml-js";

const fhirMessage1Str = fs.readFileSync(path.join(__dirname, "./parent-prescription-1/fhir-message.json"), "utf8")
const hl7V3Message1Str = fs.readFileSync(path.join(__dirname, "./parent-prescription-1/hl7-v3-message.xml"), "utf8")
const hl7V3SignatureFragments1Str = fs.readFileSync(path.join(__dirname, "./parent-prescription-1/hl7-v3-signature-fragments.xml"), "utf8")
const hl7V3SignatureFragmentsCanonicalized1 = fs.readFileSync(path.join(__dirname, "./parent-prescription-1/hl7-v3-signature-fragments-canonicalized.txt"), "utf8")
const fhirMessageDigest1Str = fs.readFileSync(path.join(__dirname, "./parent-prescription-1/fhir-message-digest.json"), "utf8")

const fhirMessage1 = JSON.parse(fhirMessage1Str) as Bundle
const hl7V3Message1 = XmlJs.xml2js(hl7V3Message1Str, {compact: true}) as ElementCompact
const hl7V3SignatureFragments1 = XmlJs.xml2js(hl7V3SignatureFragments1Str, {compact: true}) as ElementCompact
const fhirMessageDigest1 = JSON.parse(fhirMessageDigest1Str) as Parameters

export const examplePrescription1 = {
    fhirMessage: fhirMessage1,
    hl7V3Message: hl7V3Message1,
    hl7V3ParentPrescription: hl7V3Message1.PORX_IN020101UK31.ControlActEvent.subject.ParentPrescription as ParentPrescription,
    hl7V3SignatureFragments: hl7V3SignatureFragments1,
    hl7V3FragmentsCanonicalized: hl7V3SignatureFragmentsCanonicalized1.replace("\n", ""),
    fhirMessageDigest: fhirMessageDigest1
}

const fhirMessage2Str = fs.readFileSync(path.join(__dirname, "./parent-prescription-2/fhir-message.json"), "utf8")
const hl7V3Message2Str = fs.readFileSync(path.join(__dirname, "./parent-prescription-2/hl7-v3-message.xml"), "utf8")

const fhirMessage2 = JSON.parse(fhirMessage2Str) as Bundle
const hl7V3Message2 = XmlJs.xml2js(hl7V3Message2Str, {compact: true}) as ElementCompact

export const examplePrescription2 = {
    fhirMessage: fhirMessage2,
    hl7V3Message: hl7V3Message2,
    hl7V3ParentPrescription: hl7V3Message2.PORX_IN020101UK31.ControlActEvent.subject.ParentPrescription as ParentPrescription
}

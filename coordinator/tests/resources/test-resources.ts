import * as XmlJs from 'xml-js'
import * as fs from 'fs'
import * as path from "path"
import {ParentPrescription} from "../../src/services/hl7-v3-prescriptions";
import {Bundle} from "../../src/services/fhir-resources";

const fhirPrescriptionMessage1Str = fs.readFileSync(path.join(__dirname, "./parent-prescription-1/fhir-message.json"), "utf8")
export const fhirPrescriptionMessage1 = JSON.parse(fhirPrescriptionMessage1Str) as Bundle

const fhirPrescriptionMessage2Str = fs.readFileSync(path.join(__dirname, "./parent-prescription-2/fhir-message.json"), "utf8")
export const fhirPrescriptionMessage2 = JSON.parse(fhirPrescriptionMessage2Str) as Bundle

const hl7V3ParentPrescriptionMessage1Str = fs.readFileSync(path.join(__dirname, "./parent-prescription-1/hl7-v3-message.xml"), "utf8")
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const hl7V3ParentPrescriptionMessage1 = XmlJs.xml2js(hl7V3ParentPrescriptionMessage1Str, {compact: true}) as any
export const hl7V3ParentPrescription1 = hl7V3ParentPrescriptionMessage1.PORX_IN020101UK31.ControlActEvent.subject.ParentPrescription as ParentPrescription

const hl7V3ParentPrescriptionMessage2Str = fs.readFileSync(path.join(__dirname, "./parent-prescription-2/hl7-v3-message.xml"), "utf8")
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const hl7V3ParentPrescriptionMessage2 = XmlJs.xml2js(hl7V3ParentPrescriptionMessage2Str, {compact: true}) as any
export const hl7V3ParentPrescription2 = hl7V3ParentPrescriptionMessage2.PORX_IN020101UK31.ControlActEvent.subject.ParentPrescription as ParentPrescription

const hl7V3ParentPrescriptionFragments1Str = fs.readFileSync(path.join(__dirname, "./parent-prescription-1/hl7-v3-signature-fragments.xml"), "utf8")
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const hl7V3ParentPrescriptionFragments1 = XmlJs.xml2js(hl7V3ParentPrescriptionFragments1Str, {compact: true}) as any

export const hl7V3SignedInfoCanonicalized1 = fs.readFileSync(path.join(__dirname, "./parent-prescription-1/hl7-v3-signed-info-canonicalized.txt"), "utf8")

export const hl7V3ParentPrescriptionFragmentsCanonicalized1 = fs.readFileSync(path.join(__dirname, "./parent-prescription-1/hl7-v3-signature-fragments-canonicalized.txt"), "utf8")

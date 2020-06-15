import * as XmlJs from 'xml-js'
import * as fs from 'fs'
import * as path from "path";
import {ParentPrescription} from "../../src/services/hl7-v3-prescriptions";

const hl7V3ParentPrescriptionMessage1Str = fs.readFileSync(path.join(__dirname, "./parent-prescription-hl7-v3-1.xml"), "utf8")
const hl7V3ParentPrescriptionMessage1 = XmlJs.xml2js(hl7V3ParentPrescriptionMessage1Str, {compact: true}) as any

export const hl7V3ParentPrescription1 = hl7V3ParentPrescriptionMessage1.PORX_IN020101UK31.ControlActEvent.subject.ParentPrescription as ParentPrescription
export const hl7V3Patient1 = hl7V3ParentPrescription1.recordTarget.Patient
export const hl7V3Prescription1 = hl7V3ParentPrescription1.pertinentInformation1.pertinentPrescription

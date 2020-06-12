import * as XmlJs from 'xml-js'
import * as fs from 'fs'
import * as path from "path";
import {ParentPrescription} from "../../src/services/hl7-v3-prescriptions";

const validHl7V3ParentPrescriptionMessageStr = fs.readFileSync(path.join(__dirname, "./valid-hl7-v3-prescription.xml"), "utf8")
const validHl7V3ParentPrescriptionMessage = XmlJs.xml2js(validHl7V3ParentPrescriptionMessageStr, {compact: true}) as any

export const validHl7V3ParentPrescription = validHl7V3ParentPrescriptionMessage.PORX_IN020101UK31.ControlActEvent.subject.ParentPrescription as ParentPrescription
export const validHl7V3Patient = validHl7V3ParentPrescription.recordTarget.Patient
export const validHl7V3Prescription = validHl7V3ParentPrescription.pertinentInformation1.pertinentPrescription

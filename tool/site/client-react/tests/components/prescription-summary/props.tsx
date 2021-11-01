import {SummaryPractitionerRole} from "../../../src/components/prescription-summary/practitionerRoleSummaryList"
import {SummaryPatient} from "../../../src/components/prescription-summary/patientSummaryList"
import {SummaryPrescription} from "../../../src/components/prescription-summary/prescriptionSummaryView"
import {SummaryMedication} from "../../../src/components/prescription-summary/medicationSummary"

export const summaryMedication: SummaryMedication = {
  dispenserNotes: ["See your GP next week", "Don't forget your 5 a day"],
  dosageInstruction: ["Only take during meal", "Can split in half"],
  prescriptionEndorsements: ["FS", "DM", "YOLO"],
  quantityUnit: "ml",
  quantityValue: 30,
  snomedCode: "3003302996",
  snomedCodeDescription: "Liquid dopamine"
}

export const summaryPatient: SummaryPatient = {
  name: "CORY, ETTA (MISS)",
  nhsNumber: "9990548609",
  dateOfBirth: "01-Jan-1999",
  gender: "Female",
  addressLines: ["1 Trevelyan Square", "Boar Lane", "Leeds", "West Yorkshire", "LS1 6AE"]
}

export const summaryPractitionerRole: SummaryPractitionerRole = {
  name: "EDWARDS, Thomas (DR)",
  telecom: "01234567890",
  organization: {
    name: "SOMERSET BOWEL CANCER SCREENING CENTRE",
    odsCode: "A99968",
    addressLines: ["MUSGROVE PARK HOSPITAL", "TAUNTON", "TA1 5DA"]
  },
  parentOrganization: {
    name: "TAUNTON AND SOMERSET NHS FOUNDATION TRUST",
    odsCode: "RBA"
  }
}

export const summaryPrescription: SummaryPrescription = {
  medications: [summaryMedication],
  patient: summaryPatient,
  practitionerRole: summaryPractitionerRole
}

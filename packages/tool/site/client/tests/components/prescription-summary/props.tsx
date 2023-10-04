import {
  SummaryPractitionerRole,
  SummaryPatient,
  SummaryMedication,
  PrescriptionSummaryProps,
  PrescriptionLevelDetailsProps,
  EditPrescriptionProps
} from "../../../src/components/prescription-summary/fragments"

import {PrescriptionSummaryViewProps} from "../../../src/components/prescription-summary"

export const summaryMedication: SummaryMedication = {
  dispenserNotes: ["See your GP next week", "Don't forget your 5 a day"],
  dosageInstruction: ["Only take during meal", "Can split in half"],
  prescriptionEndorsements: ["FS", "DM", "YOLO"],
  quantityUnit: "ml",
  quantityValue: 30,
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
  professionalCodes: ["GMC Number - 12345"],
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

export const prescriptionLevelDetailProps: PrescriptionLevelDetailsProps = {
  prescriptionId: "A0548B-A99968-451485",
  courseOfTherapyType: "Short course (acute) therapy",
  prescriptionTypeCode: "0101",
  currentIssueNumber: 1,
  endIssueNumber: 6,
  //authoredOn: "01-11-2021",
  startDate: "02-11-2021",
  nominatedOds: "VNCEL",
  nominatedType: "Other (e.g. Community Pharmacy)",
  patientInstructions: ["Take the medicine."],
  editMode: false
}

const prescriptionSummary: PrescriptionSummaryProps = {
  medications: [summaryMedication],
  patient: summaryPatient,
  practitionerRole: summaryPractitionerRole
}

const getEditorProps = (enabled: boolean): EditPrescriptionProps => {
  return {
    editMode: enabled,
    setEditMode: enabled ? () => null : undefined,
    errors: {}
  }
}

export const summaryPrescription: PrescriptionSummaryViewProps = {
  prescriptionSummary: prescriptionSummary,
  prescriptionLevelDetails: prescriptionLevelDetailProps,
  handleDownload: () => null,
  editorProps: getEditorProps(false)
}

export const editableSummaryPrescription: PrescriptionSummaryViewProps = {
  prescriptionSummary: prescriptionSummary,
  prescriptionLevelDetails: prescriptionLevelDetailProps,
  handleDownload: () => null,
  editorProps: getEditorProps(true)
}

// TODO: add summary view wrapped with PaginationWrapper

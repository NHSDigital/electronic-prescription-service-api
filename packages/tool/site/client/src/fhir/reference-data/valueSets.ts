import {Coding} from "fhir/r4"

export const VALUE_SET_PRESCRIBER_ENDORSEMENT: Array<Coding> = [
  {
    code: "CC",
    system: "https://fhir.nhs.uk/CodeSystem/medicationrequest-endorsement",
    display: "Contraceptive"
  },
  {
    code: "FS",
    system: "https://fhir.nhs.uk/CodeSystem/medicationrequest-endorsement",
    display: "Free Supply for Specified Use"
  },
  {
    code: "ACBS",
    system: "https://fhir.nhs.uk/CodeSystem/medicationrequest-endorsement",
    display: "Advisory Committee on Borderline Substances"
  },
  {
    code: "SLS",
    system: "https://fhir.nhs.uk/CodeSystem/medicationrequest-endorsement",
    display: "Selected List Scheme"
  },
  {
    code: "AF",
    system: "https://fhir.nhs.uk/CodeSystem/medicationrequest-endorsement",
    display: "Food replacement/food supplement products"
  }
]

export const DISPENSER_ENDORSEMENT_CODE_NONE = "NDEC"

export const VALUE_SET_DISPENSER_ENDORSEMENT: Array<Coding> = [
  {
    code: "BB",
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-endorsement",
    display: "Broken Bulk"
  },
  {
    code: "ED",
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-endorsement",
    display: "Extemporaneously dispensed"
  },
  {
    code: "IP",
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-endorsement",
    display: "Invoice Price for less common products or special items"
  },
  {
    code: "MF",
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-endorsement",
    display: "Measured and Fitted"
  },
  {
    code: "NCSO",
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-endorsement",
    display: "No Cheaper Stock Obtainable"
  },
  {
    code: DISPENSER_ENDORSEMENT_CODE_NONE,
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-endorsement",
    display: "No Dispenser Endorsement Code"
  },
  {
    code: "XP",
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-endorsement",
    display: "Out of Pocket Expenses"
  },
  {
    code: "PC",
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-endorsement",
    display: "Prescriber Contacted"
  },
  {
    code: "PNC",
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-endorsement",
    display: "Prescriber Not Contacted"
  },
  {
    code: "RC",
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-endorsement",
    display: "Rebate Claimed"
  },
  {
    code: "SSP",
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-endorsement",
    display: "Serious Shortage Protocol"
  },
  {
    code: "SP",
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-endorsement",
    display: "Special License"
  },
  {
    code: "ZD",
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-endorsement",
    display: "Zero Discount (List B only)"
  }
]

export const PRESCRIPTION_CHARGE_EXEMPTION_CODE_NONE = "0001"

export const VALUE_SET_PRESCRIPTION_CHARGE_EXEMPTION: Array<Coding> = [
  {
    code: PRESCRIPTION_CHARGE_EXEMPTION_CODE_NONE,
    system: "https://fhir.nhs.uk/CodeSystem/prescription-charge-exemption",
    display: "Patient has paid appropriate charges"
  },
  {
    code: "0002",
    system: "https://fhir.nhs.uk/CodeSystem/prescription-charge-exemption",
    display: "is under 16 years of age"
  },
  {
    code: "0003",
    system: "https://fhir.nhs.uk/CodeSystem/prescription-charge-exemption",
    display: "is 16, 17 or 18 and in full-time education"
  },
  {
    code: "0004",
    system: "https://fhir.nhs.uk/CodeSystem/prescription-charge-exemption",
    display: "is 60 years of age or over"
  },
  {
    code: "0005",
    system: "https://fhir.nhs.uk/CodeSystem/prescription-charge-exemption",
    display: "has a valid maternity exemption certificate"
  },
  {
    code: "0006",
    system: "https://fhir.nhs.uk/CodeSystem/prescription-charge-exemption",
    display: "has a valid medical exemption certificate"
  },
  {
    code: "0007",
    system: "https://fhir.nhs.uk/CodeSystem/prescription-charge-exemption",
    display: "has a valid prescription pre-payment certificate"
  },
  {
    code: "0008",
    system: "https://fhir.nhs.uk/CodeSystem/prescription-charge-exemption",
    display: "has a War Pension exemption certificate"
  },
  {
    code: "0009",
    system: "https://fhir.nhs.uk/CodeSystem/prescription-charge-exemption",
    display: "is named on a current HC2 charges certificate"
  },
  {
    code: "0010",
    system: "https://fhir.nhs.uk/CodeSystem/prescription-charge-exemption",
    display: "was prescribed free-of-charge contraceptives"
  },
  {
    code: "0011",
    system: "https://fhir.nhs.uk/CodeSystem/prescription-charge-exemption",
    display: "gets income support (IS)"
  },
  {
    code: "0012",
    system: "https://fhir.nhs.uk/CodeSystem/prescription-charge-exemption",
    display: "gets income based Job Seeker's Allowance (JSA (IB))"
  },
  {
    code: "0013",
    system: "https://fhir.nhs.uk/CodeSystem/prescription-charge-exemption",
    display: "is entitled to, or named on a VALID NHS tax credit exemption certificate"
  },
  {
    code: "0014",
    system: "https://fhir.nhs.uk/CodeSystem/prescription-charge-exemption",
    display: "has a partner who gets Pension Credit Guarantee Credit (PGCC)"
  },
  {
    code: "0015",
    system: "https://fhir.nhs.uk/CodeSystem/prescription-charge-exemption",
    display: "Patient does not need to pay the prescription charge"
  }
]

export enum COURSE_OF_THERAPY_TYPE_CODES {
  ACUTE = "acute",
  CONTINUOUS = "continuous",
  CONTINUOUS_REPEAT_DISPENSING = "continuous-repeat-dispensing"
}

export const VALUE_SET_COURSE_OF_THERAPY_TYPE: Array<Coding> = [
  {
    code: COURSE_OF_THERAPY_TYPE_CODES.ACUTE,
    system: "http://terminology.hl7.org/CodeSystem/medicationrequest-course-of-therapy",
    display: "Short course (acute) therapy"
  },
  {
    code: COURSE_OF_THERAPY_TYPE_CODES.CONTINUOUS,
    system: "http://terminology.hl7.org/CodeSystem/medicationrequest-course-of-therapy",
    display: "Continuous long term therapy"
  },
  {
    code: COURSE_OF_THERAPY_TYPE_CODES.CONTINUOUS_REPEAT_DISPENSING,
    system: "https://fhir.nhs.uk/CodeSystem/medicationrequest-course-of-therapy",
    display: "Continuous long term (repeat dispensing)"
  }
]

export enum LineItemStatus {
  DISPENSED = "0001",
  NOT_DISPENSED = "0002",
  PARTIALLY_DISPENSED = "0003",
  OWING = "0004",
  CANCELLED = "0005",
  EXPIRED = "0006",
  TO_BE_DISPENSED = "0007",
  WITH_DISPENSER = "0008"
}

export const VALUE_SET_LINE_ITEM_STATUS: Array<Coding> = [
  {
    code: LineItemStatus.DISPENSED,
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-type",
    display: "Item fully dispensed"
  },
  {
    code: LineItemStatus.NOT_DISPENSED,
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-type",
    display: "Item not dispensed"
  },
  {
    code: LineItemStatus.PARTIALLY_DISPENSED,
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-type",
    display: "Item dispensed - partial"
  },
  {
    code: LineItemStatus.OWING,
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-type",
    display: "Item not dispensed owing"
  },
  {
    code: LineItemStatus.CANCELLED,
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-type",
    display: "Item cancelled"
  },
  {
    code: LineItemStatus.EXPIRED,
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-type",
    display: "Expired"
  },
  {
    code: LineItemStatus.TO_BE_DISPENSED,
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-type",
    display: "Item to be dispensed"
  },
  {
    code: LineItemStatus.WITH_DISPENSER,
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-type",
    display: "Item with dispenser"
  }
]

export enum PrescriptionStatus {
  TO_BE_DISPENSED = "0001",
  WITH_DISPENSER = "0002",
  PARTIALLY_DISPENSED = "0003",
  EXPIRED = "0004",
  CANCELLED = "0005",
  DISPENSED = "0006",
  NOT_DISPENSED = "0007"
}

export const VALUE_SET_PRESCRIPTION_STATUS: Array<Coding> = [
  {
    code: PrescriptionStatus.TO_BE_DISPENSED,
    system: "https://fhir.nhs.uk/CodeSystem/EPS-task-business-status",
    display: "To be Dispensed"
  },
  {
    code: PrescriptionStatus.WITH_DISPENSER,
    system: "https://fhir.nhs.uk/CodeSystem/EPS-task-business-status",
    display: "With Dispenser"
  },
  {
    code: PrescriptionStatus.PARTIALLY_DISPENSED,
    system: "https://fhir.nhs.uk/CodeSystem/EPS-task-business-status",
    display: "With Dispenser - Active"
  },
  {
    code: PrescriptionStatus.EXPIRED,
    system: "https://fhir.nhs.uk/CodeSystem/EPS-task-business-status",
    display: "Expired"
  },
  {
    code: PrescriptionStatus.CANCELLED,
    system: "https://fhir.nhs.uk/CodeSystem/EPS-task-business-status",
    display: "Cancelled"
  },
  {
    code: PrescriptionStatus.DISPENSED,
    system: "https://fhir.nhs.uk/CodeSystem/EPS-task-business-status",
    display: "Dispensed"
  },
  {
    code: PrescriptionStatus.NOT_DISPENSED,
    system: "https://fhir.nhs.uk/CodeSystem/EPS-task-business-status",
    display: "Not Dispensed"
  }
]

export const VALUE_SET_NON_DISPENSING_REASON: Array<Coding> = [
  {
    code: "0001",
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-status-reason",
    display: "Not required as instructed by the patient"
  },
  {
    code: "0002",
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-status-reason",
    display: "Clinically unsuitable"
  },
  {
    code: "0003",
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-status-reason",
    display: "Owings note issued to patient"
  },
  {
    code: "0004",
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-status-reason",
    display: "Prescription cancellation"
  },
  {
    code: "0005",
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-status-reason",
    display: "Prescription cancellation due to death"
  },
  {
    code: "0006",
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-status-reason",
    display: "Illegal NHS prescription"
  },
  {
    code: "0007",
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-status-reason",
    display: "Prescribed out of scope item"
  },
  {
    code: "0008",
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-status-reason",
    display: "Item or prescription expired"
  },
  {
    code: "0009",
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-status-reason",
    display: "Not allowed on FP10"
  },
  {
    code: "0010",
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-status-reason",
    display: "Patient did not collect medication"
  },
  {
    code: "0011",
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-status-reason",
    display: "Patient purchased medication over the counter"
  }
]

export enum ReturnStatusReason {
  PATIENT_NON_ATTENDANCE = "0001",
  UNABLE_TO_DISPNESE_MEDICATION = "0002",
  PATIENT_REQUESTED_RELEASE = "0003",
  ANOTHER_DISPENSER_REQUESTED_RELEASE_FOR_PATIENT = "0004",
  INVALID_DIGITAL_SIGNATURE = "0005",
  REJECTED_DUE_TO_VERSION_PROBLEM = "0006",
  PRESCRIPTION_INVALID_OR_UNREADABLE = "0007",
  PRESCRIPTION_EXPIRED = "0008"
}

const VALUE_SET_RETURN_STATUS_REASON_SYSTEM = "https://fhir.nhs.uk/CodeSystem/EPS-task-dispense-return-status-reason"

export const VALUE_SET_RETURN_STATUS_REASON: Array<Coding> = [
  {
    system: VALUE_SET_RETURN_STATUS_REASON_SYSTEM,
    code: ReturnStatusReason.PATIENT_NON_ATTENDANCE,
    display: "Patient non-attendance"
  },
  {
    system: VALUE_SET_RETURN_STATUS_REASON_SYSTEM,
    code: ReturnStatusReason.UNABLE_TO_DISPNESE_MEDICATION,
    display: "Unable to dispense medication on prescriptions"
  },
  {
    system: VALUE_SET_RETURN_STATUS_REASON_SYSTEM,
    code: ReturnStatusReason.PATIENT_REQUESTED_RELEASE,
    display: "Patient requested release"
  },
  {
    system: VALUE_SET_RETURN_STATUS_REASON_SYSTEM,
    code: ReturnStatusReason.ANOTHER_DISPENSER_REQUESTED_RELEASE_FOR_PATIENT,
    display: "Another dispenser requested release on behalf of the patient"
  },
  {
    system: VALUE_SET_RETURN_STATUS_REASON_SYSTEM,
    code: ReturnStatusReason.INVALID_DIGITAL_SIGNATURE,
    display: "Invalid digital signature"
  },
  {
    system: VALUE_SET_RETURN_STATUS_REASON_SYSTEM,
    code: ReturnStatusReason.REJECTED_DUE_TO_VERSION_PROBLEM,
    display: "Rejected due to version problem"
  },
  {
    system: VALUE_SET_RETURN_STATUS_REASON_SYSTEM,
    code: ReturnStatusReason.PRESCRIPTION_INVALID_OR_UNREADABLE,
    display: "Prescription otherwise invalid or unreadable"
  },
  {
    system: VALUE_SET_RETURN_STATUS_REASON_SYSTEM,
    code: ReturnStatusReason.PRESCRIPTION_EXPIRED,
    display: "Prescription expired"
  }
]

export enum WithdrawStatusReason {
  QUANTITY_UPDATE = "QU",
  MEDICATION_UPDATE = "MU",
  DOSAGE_AMENDMENTS = "DA",
  PATIENT_DETAILS_AMENDMENTS = "PA",
  OTHER_CLINICAL = "OC",
  OTHER_NON_CLINICAL = "ONC"
}

const VALUE_SET_WITHDRAW_STATUS_REASON_SYSTEM = "https://fhir.nhs.uk/CodeSystem/EPS-task-dispense-withdraw-reason"

export const VALUE_SET_WITHDRAW_STATUS_REASON: Array<Coding> = [
  {
    system: VALUE_SET_WITHDRAW_STATUS_REASON_SYSTEM,
    code: WithdrawStatusReason.QUANTITY_UPDATE,
    display: "Quantity Update"
  },
  {
    system: VALUE_SET_WITHDRAW_STATUS_REASON_SYSTEM,
    code: WithdrawStatusReason.MEDICATION_UPDATE,
    display: "Medication Update"
  },
  {
    system: VALUE_SET_WITHDRAW_STATUS_REASON_SYSTEM,
    code: WithdrawStatusReason.DOSAGE_AMENDMENTS,
    display: "Dosage Amendments"
  },
  {
    system: VALUE_SET_WITHDRAW_STATUS_REASON_SYSTEM,
    code: WithdrawStatusReason.PATIENT_DETAILS_AMENDMENTS,
    display: "Patient Details Amendments"
  },
  {
    system: VALUE_SET_WITHDRAW_STATUS_REASON_SYSTEM,
    code: WithdrawStatusReason.OTHER_CLINICAL,
    display: "Other Clinical"
  },
  {
    system: VALUE_SET_WITHDRAW_STATUS_REASON_SYSTEM,
    code: WithdrawStatusReason.OTHER_NON_CLINICAL,
    display: "Other Non-Clinical"
  }
]

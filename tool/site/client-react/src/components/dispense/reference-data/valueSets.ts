import {Coding} from "fhir/r4"

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

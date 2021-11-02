import {Coding} from "fhir/r4"

export const VALUE_SET_LINE_ITEM_STATUS: Array<Coding> = [
  {
    code: "0001",
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-type",
    display: "Item fully dispensed"
  },
  {
    code: "0002",
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-type",
    display: "Item not dispensed"
  },
  {
    code: "0003",
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-type",
    display: "Item dispensed - partial"
  },
  {
    code: "0004",
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-type",
    display: "Item not dispensed owing"
  },
  {
    code: "0005",
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-type",
    display: "Item cancelled"
  },
  {
    code: "0006",
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-type",
    display: "Expired"
  },
  {
    code: "0007",
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-type",
    display: "Item to be dispensed"
  },
  {
    code: "0008",
    system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-type",
    display: "Item with dispenser"
  }
]

export const VALUE_SET_PRESCRIPTION_STATUS: Array<Coding> = [
  {
    code: "0001",
    system: "https://fhir.nhs.uk/CodeSystem/EPS-task-business-status",
    display: "To be Dispensed"
  },
  {
    code: "0002",
    system: "https://fhir.nhs.uk/CodeSystem/EPS-task-business-status",
    display: "With Dispenser"
  },
  {
    code: "0003",
    system: "https://fhir.nhs.uk/CodeSystem/EPS-task-business-status",
    display: "With Dispenser - Active"
  },
  {
    code: "0004",
    system: "https://fhir.nhs.uk/CodeSystem/EPS-task-business-status",
    display: "Expired"
  },
  {
    code: "0005",
    system: "https://fhir.nhs.uk/CodeSystem/EPS-task-business-status",
    display: "Cancelled"
  },
  {
    code: "0006",
    system: "https://fhir.nhs.uk/CodeSystem/EPS-task-business-status",
    display: "Dispensed"
  },
  {
    code: "0007",
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

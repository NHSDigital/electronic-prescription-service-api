import {Coding} from "fhir/r4"

const dispenserEndorsementCodings: Array<Coding> = [
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
    code: "NDEC",
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

export default dispenserEndorsementCodings

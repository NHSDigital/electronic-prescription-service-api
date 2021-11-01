import {Coding} from "fhir/r4"

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

export const VALUE_SET_PRESCRIPTION_CHARGE_EXEMPTION: Array<Coding> = [
  {
    code: "0001",
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

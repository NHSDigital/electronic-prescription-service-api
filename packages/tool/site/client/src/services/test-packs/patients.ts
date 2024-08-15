import * as fhir from "fhir/r4"
import {PatientRow} from "./xls"

export function createPatient(row: PatientRow): fhir.BundleEntry {
  return {
    fullUrl: "urn:uuid:78d3c2eb-009e-4ec8-a358-b042954aa9b2",
    resource: {
      resourceType: "Patient",
      identifier: [
        {
          system: "https://fhir.nhs.uk/Id/nhs-number",
          value: row.nhsNumber
        }
      ],
      name: [
        {
          use: "usual",
          family: row.familyName,
          given: getGivenName(row),
          prefix: [row.title]
        }
      ],
      gender: getGender(row),
      birthDate: getBirthDate(row),
      address: [
        {
          use: "home",
          line: getAddressLines(row),
          postalCode: row.postcode
        }
      ],
      generalPractitioner: [
        {
          identifier: {
            system: "https://fhir.nhs.uk/Id/ods-organization-code",
            value: "A83008"
          }
        }
      ]
    } satisfies fhir.Patient
  }
}

function getGivenName(row: PatientRow): Array<string> {
  return [
    row.otherGivenName,
    row.givenName
  ].filter(Boolean)
}

// pds test data to eps translation
// todo: analyse and address any inconsistencies between pds and eps across platform?
function getGender(row: PatientRow): fhir.Patient["gender"] {
  const gender = row.gender
  if (gender === "indeterminate") {
    return "other"
  }
  if (gender === "not known") {
    return "unknown"
  }
  return gender as fhir.Patient["gender"]
}

// pds test data to eps translation
// todo: analyse and address any inconsistencies between pds and eps across platform?
function getBirthDate(row: PatientRow): string {
  return `${row.dateOfBirth.substring(0, 4)}`
    + `-${row.dateOfBirth.toString().substring(4, 6)}`
    + `-${row.dateOfBirth.toString().substring(6)}`
}

function getAddressLines(row: PatientRow): Array<string> {
  return [
    row.addressLine1,
    row.addressLine2,
    row.addressLine3,
    row.addressLine4
  ].filter(Boolean)
}

import * as fhir from "fhir/r4"
import {XlsRow} from "./helpers"

export function createPatients(rows: Array<XlsRow>): Array<fhir.BundleEntry> {
  return rows.map(row => {
    return {
      fullUrl: "urn:uuid:78d3c2eb-009e-4ec8-a358-b042954aa9b2",
      resource: {
        resourceType: "Patient",
        identifier: [
          {
            system: "https://fhir.nhs.uk/Id/nhs-number",
            value: row["NHS_NUMBER"].toString()
          }
        ],
        name: [
          {
            use: "usual",
            family: row["FAMILY_NAME"],
            given: getGivenName(row),
            prefix: [row["TITLE"]]
          }
        ],
        gender: getGender(row),
        birthDate: getBirthDate(row),
        address: [
          {
            use: "home",
            line: getAddressLines(row),
            postalCode: row["POST_CODE"]
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
      } as fhir.Patient
    }
  })
}

function getGivenName(row: XlsRow): string[] {
  return [
    row["OTHER_GIVEN_NAME"],
    row["GIVEN_NAME"]
  ].filter(Boolean)
}

function getGender(row: XlsRow) {
  const gender = row["GENDER"].toLowerCase()
  if (gender === "indeterminate") {
    return "other"
  }
  if (gender === "not known") {
    return "unknown"
  }
  return gender
}

function getBirthDate(row: XlsRow): string {
  return `${row["DATE_OF_BIRTH"].toString().substring(0, 4)}`
    + `-${row["DATE_OF_BIRTH"].toString().substring(4, 6)}`
    + `-${row["DATE_OF_BIRTH"].toString().substring(6)}`
}

function getAddressLines(row: XlsRow): string[] {
  return [
    row["ADDRESS_LINE_1"],
    row["ADDRESS_LINE_2"],
    row["ADDRESS_LINE_3"],
    row["ADDRESS_LINE_4"]
  ].filter(Boolean)
}

export function getPatient(patients: Array<fhir.BundleEntry>, prescriptionRow: XlsRow): fhir.BundleEntry {
  const testNumber = parseInt(prescriptionRow["Test"])
  return patients[testNumber - 1]
}

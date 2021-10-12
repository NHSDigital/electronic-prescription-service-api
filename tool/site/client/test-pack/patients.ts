import {StringKeyedObject} from "./helpers"
import {BundleEntry, Patient} from "../models"

export function createPatients(rows: Array<StringKeyedObject>): Array<BundleEntry> {
  return rows.map(row => {
    return {
      fullUrl: "urn:uuid:78d3c2eb-009e-4ec8-a358-b042954aa9b2",
      resource: <Patient> {
        resourceType: "Patient",
        identifier: [
          {
            extension: [
              {
                url:
                  "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-NHSNumberVerificationStatus",
                valueCodeableConcept: {
                  coding: [
                    {
                      system:
                        "https://fhir.hl7.org.uk/CodeSystem/UKCore-NHSNumberVerificationStatus",
                      code: "01",
                      display: "Number present and verified"
                    }
                  ]
                }
              }
            ],
            system: "https://fhir.nhs.uk/Id/nhs-number",
            value: row["NHS_NUMBER"]
          }
        ],
        name: [
          {
            use: "usual",
            family: row["FAMILY_NAME"],
            given: [
              //row["OTHER_GIVEN_NAME"], - todo, null handling
              row["GIVEN_NAME"]
            ],
            prefix: [row["TITLE"]]
          }
        ],
        gender: getGender(row),
        birthDate: `${row["DATE_OF_BIRTH"].toString().substring(0, 4)}-${row[
          "DATE_OF_BIRTH"
        ].toString().substring(4, 6)}-${row["DATE_OF_BIRTH"].toString().substring(6)}`,
        address: [
          {
            use: "home",
            line: [
              //row["ADDRESS_LINE_1"], todo null handling
              row["ADDRESS_LINE_2"],
              //row["ADDRESS_LINE_3"],
              row["ADDRESS_LINE_4"]
              //row["ADDRESS_LINE_5"]
            ],
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
      }
    }
  })
}

function getGender(row: StringKeyedObject) {
  const gender = row["GENDER"].toLowerCase()
  if (gender === "indeterminate") {
    return "other"
  }
  if (gender === "not known") {
    return "unknown"
  }
  return gender
}
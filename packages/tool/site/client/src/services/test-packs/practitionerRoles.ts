import * as fhir from "fhir/r4"
import {PrescriberRow} from "./xls"

export function createPractitionerRole(row: PrescriberRow): fhir.BundleEntry {
  const practitionerRoleBundleEntry = {
    fullUrl: "urn:uuid:56166769-c1c4-4d07-afa8-132b5dfca666",
    resource: {
      resourceType: "PractitionerRole",
      id: "56166769-c1c4-4d07-afa8-132b5dfca666",
      identifier: [
        {
          system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
          value: "100102238986"
        }
      ],
      practitioner: {
        reference: "urn:uuid:a8c85454-f8cb-498d-9629-78e2cb5fa47a"
      },
      organization: {
        reference: "urn:uuid:3b4b03a5-52ba-4ba6-9b82-70350aa109d8"
      },
      code: [
        {
          coding: [
            {
              system: "https://fhir.nhs.uk/CodeSystem/NHSDigital-SDS-JobRoleCode",
              code: row.roleCode,
              display: row.roleDescription
            }
          ]
        }
      ],
      telecom: [
        {
          system: "phone",
          value: row.telecom,
          use: "work"
        }
      ]
    } satisfies fhir.PractitionerRole
  }

  const prescribingCode = row.prescribingCode?.toString()
  const prescribingCodeType = row.prescribingCodeType?.toString()
  if (prescribingCodeType === "Spurious") {
    practitionerRoleBundleEntry.resource.identifier.push({
      system: "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code",
      value: prescribingCode
    })
  }

  return practitionerRoleBundleEntry
}

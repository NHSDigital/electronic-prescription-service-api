import * as fhir from "fhir/r4"
import {PrescriptionRow, XlsRow} from "./xls"

export function getPractitionerRole(practitioners: Array<fhir.BundleEntry>, prescriptionRow: PrescriptionRow): fhir.BundleEntry {
  if (!practitioners.length) {
    return DEFAULT_PRACTITIONER_ROLE_BUNDLE_ENTRY
  }

  const testNumber = parseInt(prescriptionRow.testId)
  return practitioners[testNumber - 1]
}

export function createPractitionerRoles(rows: Array<XlsRow>): Array<fhir.BundleEntry> {
  return rows.map(row => {
    const practitionerRolePartial = {
      code: [
        {
          coding: [
            {
              system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
              code: row["Role Code"],
              display: row["Role Description"]
            }
          ]
        }
      ]
    }

    const practitionerRoleBundleEntry = {
      ...DEFAULT_PRACTITIONER_ROLE_BUNDLE_ENTRY,
      resource: {
        ...DEFAULT_PRACTITIONER_ROLE_BUNDLE_ENTRY.resource,
        practitionerRolePartial
      }
    }

    const prescribingCode = row["Prescribing Code"]?.toString()
    const prescribingCodeType = row["Prescribing Code Type"]?.toString()
    if (prescribingCodeType === "Spurious") {
      practitionerRoleBundleEntry.resource.identifier.push({
        system: "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code",
        value: prescribingCode
      })
    }

    return practitionerRoleBundleEntry
  })
}

const DEFAULT_PRACTITIONER_ROLE_BUNDLE_ENTRY = {
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
            system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
            code: "R8000",
            display: "Clinical Practitioner Access Role"
          }
        ]
      }
    ],
    telecom: []
  } as fhir.PractitionerRole
}

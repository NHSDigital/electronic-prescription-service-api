import * as fhir from "fhir/r4"
// import {PrescriberType} from "."

export function createPractitionerRole(/*prescriptionType: PrescriberType*/): fhir.BundleEntry {
  return {
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
              system:
              "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
              code: "R8000", // todo: remove hardcoding?
              display: "Clinical Practitioner Access Role"
            }
          ]
        }
      ],
      telecom: [
        {
          system: "phone",
          value: "01234567890",
          use: "work"
        }
      ]
    } as fhir.PractitionerRole
  }
}

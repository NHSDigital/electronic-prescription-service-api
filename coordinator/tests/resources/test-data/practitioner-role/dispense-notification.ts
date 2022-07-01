import {fhir} from "@models"

export const practitionerRoleDN: fhir.PractitionerRole = {
  resourceType: "PractitionerRole",
  id: "performer",
  identifier: [
    {
      system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
      value: "555086415105"
    }
  ],
  practitioner: {
    identifier: {
      system: "https://fhir.hl7.org.uk/Id/gphc-number",
      value: "7654321"
    },
    display: "Mr Peter Potion"
  },
  organization: {
    reference: "urn:uuid:2bf9f37c-d88b-4f86-ad5f-373c1416e04b"
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
  telecom: [
    {
      system: "phone",
      use: "work",
      value: "0532567890"
    }
  ]
}

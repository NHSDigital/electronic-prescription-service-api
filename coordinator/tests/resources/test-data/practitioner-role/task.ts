import {fhir} from "@models"

export const practitionerRoleTask: fhir.PractitionerRole = {
  resourceType: "PractitionerRole",
  id: "requester",
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
    display: "Ms Lottie Maifeld"
  },
  organization: {
    reference: "#organisation"
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
      value: "01234567890"
    }
  ]
}

import {fhir} from "@models"

const doctorPractitionerRole: fhir.PractitionerRole = {
  resourceType: "PractitionerRole",
  id: "3d597ba8-68fe-408c-b30f-c21478fa5721",
  identifier: [
    {
      system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
      value: "601986680555"
    },
    {
      system: "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code",
      value: "683458"
    }
  ],
  practitioner: {
    reference: "urn:uuid:dd586f2d-6bf0-4fa3-b7a7-ffabb0bc1bf0"
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
          display: "Clinical Practitioner Access Role "
        }
      ]
    }
  ],
  healthcareService: [
    {
      reference: "urn:uuid:54b0506d-49af-4245-9d40-d7d64902055e",
      display: "SOMERSET BOWEL CANCER SCREENING CENTRE"
    }
  ],
  telecom: [
    {
      system: "phone",
      value: "01234567890",
      use: "work"
    }
  ]
}

const nursePractitionerRole: fhir.PractitionerRole = {
  resourceType: "PractitionerRole",
  id: "56a7d6e0-05e2-4fc6-85f5-717390120bb9",
  identifier: [
    {
      system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
      value: "100102238986"
    },
    {
      system: "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code",
      value: "12A3456B"
    }
  ],
  practitioner: {
    reference: "urn:uuid:20dab9e9-bb2d-4cbb-b2a5-57cfa9698217"
  },
  organization: {
    reference: "urn:uuid:3b4b03a5-52ba-4ba6-9b82-70350aa109d8"
  },
  code: [
    {
      coding: [
        {
          system: "https://fhir.nhs.uk/CodeSystem/NHSDigital-SDS-JobRoleCode",
          code: "S8001:G8001:R8001",
          display: "Nurse Access Role"
        }
      ]
    }
  ],
  healthcareService: [
    {
      reference: "urn:uuid:54b0506d-49af-4245-9d40-d7d64902055e",
      display: "SOMERSET BOWEL CANCER SCREENING CENTRE"
    }
  ],
  telecom: [
    {
      system: "phone",
      value: "01234567890",
      use: "work"
    }
  ]
}

const pharmacistPractitionerRole: fhir.PractitionerRole = {
  resourceType: "PractitionerRole",
  id: "ea81e4eb-2ec9-4c1d-93a0-e31e2f5d48ac",
  identifier: [
    {
      system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
      value: "201715352555"
    },
    {
      system: "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code",
      value: "2083469"
    }
  ],
  practitioner: {
    reference: "urn:uuid:7771ac38-a6af-425b-b252-ba79aa489c1e"
  },
  organization: {
    reference: "urn:uuid:3b4b03a5-52ba-4ba6-9b82-70350aa109d8"
  },
  code: [
    {
      coding: [
        {
          system: "https://fhir.nhs.uk/CodeSystem/NHSDigital-SDS-JobRoleCode",
          code: "S8003:G8003:R8003",
          display: "Health Professional Access Role"
        }
      ]
    }
  ],
  healthcareService: [
    {
      reference: "urn:uuid:54b0506d-49af-4245-9d40-d7d64902055e",
      display: "SOMERSET BOWEL CANCER SCREENING CENTRE"
    }
  ],
  telecom: [
    {
      system: "phone",
      value: "01234567890",
      use: "work"
    }
  ]
}

const practitionerRoles = new Map<string, fhir.PractitionerRole>([
  ["doctor", doctorPractitionerRole],
  ["nurse", nursePractitionerRole],
  ["pharmacist", pharmacistPractitionerRole]
])

export default practitionerRoles

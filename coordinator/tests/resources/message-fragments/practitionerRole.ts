import * as fhir from "../../../src/models/fhir/fhir-resources"

const practitionerRoleFullUrl = "urn:uuid:56166769-c1c4-4d07-afa8-132b5dfca666"

const doctorPractitionerRole: fhir.PractitionerRole = {
  resourceType: "PractitionerRole",
  id: "56166769-c1c4-4d07-afa8-132b5dfca666",
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
    reference: "urn:uuid:a8c85454-f8cb-498d-9629-78e2cb5fa47a"
  },
  organization: {
    reference: "urn:uuid:3b4b03a5-52ba-4ba6-9b82-70350aa109d8"
  },
  code: [
    {
      coding: [
        {
          system: "https://fhir.nhs.uk/R4/CodeSystem/UKCore-SDSJobRoleName",
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
  id: "56166769-c1c4-4d07-afa8-132b5dfca666",
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
    reference: "urn:uuid:a8c85454-f8cb-498d-9629-78e2cb5fa47a"
  },
  organization: {
    reference: "urn:uuid:3b4b03a5-52ba-4ba6-9b82-70350aa109d8"
  },
  code: [
    {
      coding: [
        {
          system: "https://fhir.nhs.uk/R4/CodeSystem/UKCore-SDSJobRoleName",
          code: "R8001",
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
  id: "56166769-c1c4-4d07-afa8-132b5dfca666",
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
    reference: "urn:uuid:a8c85454-f8cb-498d-9629-78e2cb5fa47a"
  },
  organization: {
    reference: "urn:uuid:3b4b03a5-52ba-4ba6-9b82-70350aa109d8"
  },
  code: [
    {
      coding: [
        {
          system: "https://fhir.nhs.uk/R4/CodeSystem/UKCore-SDSJobRoleName",
          code: "R8003",
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

const doctorBundleEntry: fhir.BundleEntry = {
  fullUrl: practitionerRoleFullUrl,
  resource: doctorPractitionerRole
}

const nurseBundleEntry: fhir.BundleEntry = {
  fullUrl: practitionerRoleFullUrl,
  resource: nursePractitionerRole
}

const pharmacistBundleEntry: fhir.BundleEntry = {
  fullUrl: practitionerRoleFullUrl,
  resource: pharmacistPractitionerRole
}

const practitionerRoles = new Map<string, fhir.BundleEntry>()
practitionerRoles.set("doctor", doctorBundleEntry)
practitionerRoles.set("nurse", nurseBundleEntry)
practitionerRoles.set("pharmacist", pharmacistBundleEntry)

export default practitionerRoles

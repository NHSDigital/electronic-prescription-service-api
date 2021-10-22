export const TEST_PATIENT = {
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
      value: "9990548609"
    }
  ],
  name: [
    {
      use: "official",
      family: "XXTESTPATIENT-TGNP",
      given: ["DONOTUSE"]
    }
  ],
  gender: "male",
  birthDate: "1932-01-06",
  address: [
    {
      use: "home",
      postalCode: "LS1 6AE"
    }
  ],
  generalPractitioner: [
    {
      identifier: {
        system: "https://fhir.nhs.uk/Id/ods-organization-code",
        value: "Y90001"
      }
    }
  ]
}

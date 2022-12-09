import {fhir} from "@models"

export const organization: fhir.Organization = {
  resourceType: "Organization",
  id: "organization",
  identifier: [
    {
      system: "https://fhir.nhs.uk/Id/ods-organization-code",
      value: "VNE51"
    }
  ],
  address: [
    {
      city: "West Yorkshire",
      use: "work",
      line: [
        "17 Austhorpe Road",
        "Crossgates",
        "Leeds"
      ],
      "postalCode": "LS15 8BA"
    }
  ],
  type: [
    {
      coding: [
        {
          system: "https://fhir.nhs.uk/CodeSystem/organisation-role",
          code: "182",
          display: "PHARMACY"
        }
      ]
    }
  ],
  name: "The Simple Pharmacy",
  telecom: [
    {
      system: "phone",
      use: "work",
      value: "0113 3180277"
    }
  ]
}

import {fhir} from "@models"

const gpPractice: fhir.Organization = {
  resourceType: "Organization",
  name: "HALLGARTH SURGERY",
  telecom: [
    {
      system: "phone",
      use: "work",
      value: "01159737320"
    }
  ],
  identifier: [
    {
      system: "https://fhir.nhs.uk/Id/ods-organization-code",
      value: "A83008"
    }
  ],
  address: [
    {
      use: "work",
      type: "both",
      line: [
        "HALLGARTH SURGERY",
        "CHEAPSIDE"
      ],
      city: "SHILDON",
      district: "COUNTY DURHAM",
      postalCode: "DL4 2HP"
    }
  ]
}

const organizations = new Map<string, fhir.Organization>([
  ["GP Practice", gpPractice]
])

export default organizations

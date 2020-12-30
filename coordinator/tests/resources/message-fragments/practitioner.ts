import * as fhir from "../../../src/models/fhir/fhir-resources"

const doctorPractitioner: fhir.Practitioner = {
  resourceType: "Practitioner",
  id: "dd586f2d-6bf0-4fa3-b7a7-ffabb0bc1bf0",
  identifier: [
    {
      system: "https://fhir.nhs.uk/Id/sds-user-id",
      value: "555086689106"
    },
    {
      system: "https://fhir.hl7.org.uk/Id/gmc-number",
      value: "6150129"
    }
  ],
  name: [
    {
      family: "FIFTYSEVEN",
      given: [
        "RANDOM"
      ],
      prefix: [
        "MR"
      ]
    }
  ]
}

const nursePractitioner: fhir.Practitioner = {
  resourceType: "Practitioner",
  id: "20dab9e9-bb2d-4cbb-b2a5-57cfa9698217",
  identifier: [
    {
      system: "https://fhir.nhs.uk/Id/sds-user-id",
      value: "555086690109"
    },
    {
      system: "https://fhir.hl7.org.uk/Id/nmc-number",
      value: "12A3456B"
    }
  ],
  name: [
    {
      family: "Userq",
      given: [
        "Random"
      ],
      prefix: [
        "MR"
      ]
    }
  ]
}

const pharmacistPractitioner: fhir.Practitioner = {
  resourceType: "Practitioner",
  id: "7771ac38-a6af-425b-b252-ba79aa489c1e",
  identifier: [
    {
      system: "https://fhir.nhs.uk/Id/sds-user-id",
      value: "55253517102"
    },
    {
      system: "https://fhir.hl7.org.uk/Id/gphc-number",
      value: "2083469"
    }
  ],
  name: [
    {
      family: "UserM",
      given: [
        "RANDOM"
      ],
      prefix: [
        "MR"
      ]
    }
  ]
}

const practitioners = new Map<string, fhir.Practitioner>([
  ["doctor", doctorPractitioner],
  ["nurse", nursePractitioner],
  ["pharmacist", pharmacistPractitioner]
])

export default practitioners

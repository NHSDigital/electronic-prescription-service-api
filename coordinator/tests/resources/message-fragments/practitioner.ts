import * as fhir from "../../../src/models/fhir/fhir-resources"

const practitionerFullUrl = "urn:uuid:a8c85454-f8cb-498d-9629-78e2cb5fa47a"

const doctorPractitioner: fhir.Practitioner = {
  resourceType: "Practitioner",
  id: "a8c85454-f8cb-498d-9629-78e2cb5fa47a",
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
  id: "a8c85454-f8cb-498d-9629-78e2cb5fa47a",
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
  id: "a8c85454-f8cb-498d-9629-78e2cb5fa47a",
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

const practitioners = new Map<string, fhir.BundleEntry>()
practitioners.set("doctor", {
  fullUrl: practitionerFullUrl,
  resource: doctorPractitioner
})
practitioners.set("nurse", {
  fullUrl: practitionerFullUrl,
  resource: nursePractitioner
})
practitioners.set("pharmacist", {
  fullUrl: practitionerFullUrl,
  resource: pharmacistPractitioner
})

export default practitioners

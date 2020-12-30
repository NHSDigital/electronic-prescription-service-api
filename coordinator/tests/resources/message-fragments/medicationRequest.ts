import * as fhir from "../../../src/models/fhir/fhir-resources"

const nystatinMedication: fhir.Coding = {
  system: "http://snomed.info/sct",
  code: "324689003",
  display: "Nystatin 100,000units/ml oral suspension"
}

const nystatinQuantity: fhir.SimpleQuantity = {
  value: "30",
  unit: "ml",
  system: "http://snomed.info/sct",
  code: "385024007"
}

const phosphatesMedication: fhir.Coding = {
  system: "http://snomed.info/sct",
  code: "14611011000001107",
  display: "Phosphates enema (Formula B) 128ml standard tube"
}

const phosphatesQuantity: fhir.SimpleQuantity = {
  value: "1",
  unit: "Enema",
  system: "http://snomed.info/sct",
  code: "700476008"
}

const diclofenacMedication: fhir.Coding = {
  system: "http://snomed.info/sct",
  code: "30318011000001108",
  display: "Diclofenac 140mg medicated plasters"
}

const diclofenacQuantity: fhir.SimpleQuantity = {
  value: "2",
  unit: "Plaster",
  system: "http://snomed.info/sct",
  code: "733010002"
}

const waterMedication: fhir.Coding = {
  system: "http://snomed.info/sct",
  code: "110171000001104",
  display: "Water for injections 2ml ampoules"
}

const waterQuantity: fhir.SimpleQuantity = {
  value: "5",
  unit: "Ampoule",
  system: "http://snomed.info/sct",
  code: "413516001"
}

const createDispenseInfoFromQuantity = (quantity: fhir.SimpleQuantity): fhir.MedicationRequestDispenseRequest => ({
  extension: [
    {
      url: "https://fhir.nhs.uk/R4/StructureDefinition/Extension-performerSiteType",
      valueCoding: {
        system: "https://fhir.nhs.uk/CodeSystem/dispensing-site-preference",
        code: "P1"
      }
    }
  ],
  quantity: quantity,
  performer: {
    identifier: {
      system: "https://fhir.nhs.uk/Id/ods-organization-code",
      value: "FH542"
    }
  }
})

const createMedicationRequestForLineItem = (
  medication: fhir.Coding,
  dispenseRequest: fhir.MedicationRequestDispenseRequest
): fhir.MedicationRequest => ({
  resourceType: "MedicationRequest",
  id: "a54219b8-f741-4c47-b662-e4f8dfa49ab6",
  extension: [
    {
      url: "https://fhir.nhs.uk/R4/StructureDefinition/Extension-DM-prescriptionType",
      valueCoding: {
        system: "https://fhir.nhs.uk/CodeSystem/prescription-type",
        code: "1005",
        display: "Outpatient Community Prescriber - Community Practitioner Nurse prescriber"
      }
    }
  ],
  identifier: [
    {
      system: "https://fhir.nhs.uk/Id/prescription-order-item-number",
      value: "a54219b8-f741-4c47-b662-e4f8dfa49ab6"
    }
  ],
  status: "active",
  intent: "order",
  category: [
    {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/medicationrequest-category",
          code: "outpatient",
          display: "Outpatient"
        }
      ]
    }
  ],
  medicationCodeableConcept: {
    coding: [
      medication
    ]
  },
  subject: {
    reference: "urn:uuid:78d3c2eb-009e-4ec8-a358-b042954aa9b2"
  },
  authoredOn: "2020-12-21T18:15:29+00:00",
  requester: {
    reference: "urn:uuid:56166769-c1c4-4d07-afa8-132b5dfca666"
  },
  groupIdentifier: {
    extension: [
      {
        url: "https://fhir.nhs.uk/R4/StructureDefinition/Extension-PrescriptionId",
        valueIdentifier: {
          system: "https://fhir.nhs.uk/Id/prescription",
          value: "8add098c-4ed7-4596-b0d6-b6329e3ef88f"
        }
      }
    ],
    system: "https://fhir.nhs.uk/Id/prescription-order-number",
    value: "85380F-ZC643B-11EBAH"
  },
  courseOfTherapyType: {
    coding: [
      {
        system: "http://terminology.hl7.org/CodeSystem/medicationrequest-course-of-therapy",
        code: "acute",
        display: "Short course (acute) therapy"
      }
    ]
  },
  dosageInstruction: [
    {
      text: "As directed",
      additionalInstruction: [
        {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "421769005",
              display: "Follow directions"
            }
          ]
        }
      ]
    }
  ],
  dispenseRequest: dispenseRequest,
  substitution: {
    allowedBoolean: false
  }
})

const medicationRequests = new Map<string, fhir.BundleEntry>()
medicationRequests.set("nystatin", {
  fullUrl: "urn:uuid:a54219b8-f741-4c47-b662-e4f8dfa49ab6",
  resource: createMedicationRequestForLineItem(
    nystatinMedication,
    createDispenseInfoFromQuantity(nystatinQuantity)
  )
})
medicationRequests.set("phosphates", {
  fullUrl: "urn:uuid:dd994697-df0e-4202-bd5a-a8e3080bf0bc",
  resource: createMedicationRequestForLineItem(
    phosphatesMedication,
    createDispenseInfoFromQuantity(phosphatesQuantity)
  )
})
medicationRequests.set("diclofenac", {
  fullUrl: "urn:uuid:1e35d3a9-a256-4985-8476-0294bb12d37e",
  resource: createMedicationRequestForLineItem(
    diclofenacMedication,
    createDispenseInfoFromQuantity(diclofenacQuantity)
  )
})
medicationRequests.set("water", {
  fullUrl:"urn:uuid:a51041ce-9a43-4bc4-a277-cffa434bdd63",
  resource: createMedicationRequestForLineItem(
    waterMedication,
    createDispenseInfoFromQuantity(waterQuantity)
  )
})

export default medicationRequests

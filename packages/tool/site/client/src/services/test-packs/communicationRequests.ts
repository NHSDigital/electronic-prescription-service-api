import * as fhir from "fhir/r4"

export function createCommunicationRequest(
  patientEntry: fhir.BundleEntry,
  additionalInstructions: string
): fhir.BundleEntry {
  return {
    fullUrl: "urn:uuid:51793ac0-112f-46c7-a891-9af8cefb206e",
    resource: {
      resourceType: "CommunicationRequest",
      status: "unknown",
      subject: {
        reference: "urn:uuid:78d3c2eb-009e-4ec8-a358-b042954aa9b2"
      },
      payload: [
        {
          contentString: additionalInstructions || "TEST PRESCRIPTION - DO NOT DISPENSE"
        }
      ],
      requester: {
        type: "Organization",
        identifier: {
          system: "https://fhir.nhs.uk/Id/ods-organization-code",
          value: "RBA"
        }
      },
      recipient: [
        {
          type: "Patient",
          identifier: {
            system: "https://fhir.nhs.uk/Id/nhs-number",
            value: getNhsNumber(patientEntry)
          }
        }
      ]
    } satisfies fhir.CommunicationRequest
  }
}

function getNhsNumber(fhirPatient: fhir.BundleEntry): string {
  return (fhirPatient.resource as fhir.Patient).identifier.filter(
    i => i.system === "https://fhir.nhs.uk/Id/nhs-number"
  )[0].value
}

import * as fhir from "fhir/r4"

export function createMessageHeader(): fhir.BundleEntry {
  return {
    fullUrl: "urn:uuid:aef77afb-7e3c-427a-8657-2c427f71a272",
    resource: {
      resourceType: "MessageHeader",
      id: "3599c0e9-9292-413e-9270-9a1ef1ead99c",
      eventCoding: {
        system: "https://fhir.nhs.uk/CodeSystem/message-event",
        code: "prescription-order",
        display: "Prescription Order"
      },
      sender: {
        identifier: {
          system: "https://fhir.nhs.uk/Id/ods-organization-code",
          value: "RBA"
        },
        reference: "urn:uuid:56166769-c1c4-4d07-afa8-132b5dfca666",
        display: "RAZIA|ALI"
      },
      source: {
        endpoint: "urn:nhs-uk:addressing:ods:RBA"
      },
      destination: [
        {
          endpoint: `https://int.api.service.nhs.uk/electronic-prescriptions/$post-message`,
          receiver: {
            identifier: {
              system: "https://fhir.nhs.uk/Id/ods-organization-code",
              value: "X26"
            }
          }
        }
      ],
      focus: []
    } satisfies fhir.MessageHeader
  }
}

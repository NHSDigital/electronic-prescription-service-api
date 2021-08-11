import Hapi from "@hapi/hapi"

const capabilityStatement = {
  "resourceType": "CapabilityStatement",
  "id": "apim-medicines-conformance",
  "url": "https://fhir.nhs.uk/CapabilityStatement/apim-medicines-conformance",
  "version": "3.0.0",
  "name": "APIMMedicines",
  "status": "active",
  "date": "2021-04-28T00:00:00+00:00",
  "publisher": "digital.nhs.uk",
  "description": "Conformance requirements for NHS Digital Medicines APIs",
  "kind": "requirements",
  "implementationGuide":  [
    "https://simplifier.net/guide/digitalmedicines",
    "https://simplifier.net/guide/nhsdigital"
  ],
  "fhirVersion": "4.0.1",
  "format":  [
    "application/fhir+json",
    "application/fhir+xml"
  ],
  "rest":  [
    {
      "mode": "server",
      "security": {
        "service":  [
          {
            "coding":  [
              {
                "system": "http://terminology.hl7.org/CodeSystem/restful-security-service",
                "code": "OAuth",
                "display": "OAuth2 Token"
              }
            ]
          }
        ]
      },
      "resource":  [
        {
          "type": "List",
          "profile": "https://fhir.hl7.org.uk/StructureDefinition/UKCore-List"
        },
        {
          "type": "Claim",
          "profile": "https://fhir.nhs.uk/StructureDefinition/NHSDigital-Claim"
        },
        {
          "type": "CommunicationRequest",
          "profile": "https://fhir.nhs.uk/StructureDefinition/NHSDigital-CommunicationRequest"
        },
        {
          "type": "Immunization",
          "profile": "https://fhir.nhs.uk/StructureDefinition/NHSDigital-Immunization",
          "interaction":  [
            {
              "code": "search-type"
            }
          ],
          "searchParam":  [
            {
              "name": "patient:identifier",
              "type": "token",
              "documentation": "The patient identifier (e.g. NHS Number) that the immunisation is about"
            },
            {
              "name": "patient",
              "type": "reference",
              "documentation": "The patient that the immunisation is about"
            },
            {
              "name": "procedure:below",
              "type": "token",
              "definition": "https://fhir.nhs.uk/SearchParameter/procedure-code",
              "documentation": "Parent snomed procedure code for vaccinations"
            }
          ]
        },
        {
          "type": "MedicationRequest",
          "profile": "https://fhir.nhs.uk/StructureDefinition/NHSDigital-MedicationRequest",
          "interaction":  [
            {
              "code": "search-type"
            }
          ],
          "searchParam":  [
            {
              "name": "patient:identifier",
              "type": "token",
              "documentation": "Returns prescriptions for a specific patientt identifier (NHS Number)"
            },
            {
              "name": "patient",
              "type": "reference",
              "documentation": "Returns prescriptions for a specific patient"
            },
            {
              "name": "medication",
              "type": "reference",
              "documentation": "Return prescriptions for this medication reference"
            },
            {
              "name": "status",
              "type": "token",
              "documentation": "Status of the prescription"
            },
            {
              "name": "authoredon",
              "type": "date",
              "documentation": "Return prescriptions written on this date"
            }
          ]
        },
        {
          "type": "MedicationDispense",
          "profile": "https://fhir.nhs.uk/StructureDefinition/NHSDigital-MedicationDispense",
          "interaction":  [
            {
              "code": "search-type"
            }
          ],
          "searchParam":  [
            {
              "name": "patient:identifier",
              "type": "token",
              "documentation": "TThe identity (NHS Number) of a patient to list dispenses for"
            },
            {
              "name": "patient",
              "type": "reference",
              "documentation": "The identity of a patient to list dispenses for"
            }
          ]
        },
        {
          "type": "Medication",
          "profile": "https://fhir.hl7.org.uk/StructureDefinition/UKCore-Medication"
        },
        {
          "type": "Task",
          "profile": "https://fhir.nhs.uk/StructureDefinition/NHSDigital-Task",
          "interaction":  [
            {
              "code": "create"
            }
          ],
          "operation":  [
            {
              "name": "release",
              "definition": "https://fhir.nhs.uk/OperationDefinition/Task-release-message"
            }
          ]
        }
      ],
      "operation":  [
        {
          "name": "process-message",
          "definition": "http://hl7.org/fhir/OperationDefinition/MessageHeader-process-message"
        },
        {
          "name": "prepare",
          "definition": "https://fhir.nhs.uk/OperationDefinition/MessageHeader-prepare-message"
        },
        {
          "name": "validate",
          "definition": "http://hl7.org/fhir/OperationDefinition/Resource-validate"
        }
      ]
    }
  ],
  "messaging":  [
    {
      "supportedMessage":  [
        {
          "mode": "receiver",
          "definition": "https://fhir.nhs.uk/MessageDefinition/prescription-order"
        },
        {
          "mode": "receiver",
          "definition": "https://fhir.nhs.uk/MessageDefinition/prescription-order-update"
        },
        {
          "mode": "receiver",
          "definition": "https://fhir.nhs.uk/MessageDefinition/pharmacy-dispense"
        },
        {
          "mode": "receiver",
          "definition": "https://fhir.nhs.uk/MessageDefinition/dispense-claim"
        },
        {
          "mode": "receiver",
          "definition": "https://fhir.nhs.uk/MessageDefinition/vaccinations"
        },
        {
          "mode": "receiver",
          "definition": "https://fhir.nhs.uk/MessageDefinition/prescription-order-response"
        },
        {
          "mode": "receiver",
          "definition": "https://fhir.nhs.uk/MessageDefinition/dispense-claim-update"
        }
      ]
    }
  ]
}

export default [{
  method: "GET",
  path: "/metadata",
  handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
    return h.response({
      capabilityStatement: capabilityStatement
    }).code(200)
  }
}]

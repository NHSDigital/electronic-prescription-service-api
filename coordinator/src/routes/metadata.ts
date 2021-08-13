import Hapi from "@hapi/hapi"
import * as fs from "fs"
import path from "path"

const VERSION = process.env.DEPLOYED_VERSION

function readManifestFile() {
  try {
    console.log("attempt reading file")
    return fs.readFileSync(path.join(__dirname, "../resources/validator_manifest.json"), "utf-8")
  } catch (err){
    console.log(err)
    return JSON.stringify([
      {
        "packageName": "hi",
        "version": "2.1.14-alpha"
      },
      {
        "packageName": "uk.nhsdigital.r4",
        "version": "2.1.34-discovery"
      },
      {
        "packageName": "uk.nhsdigital.clinical.r4",
        "version": "2.1.0-dev"
      },
      {
        "packageName": "UK.Core.r4.v2",
        "version": "2.0.8"
      }
    ])
  }
}

const MANIFEST = JSON.parse(readManifestFile())

function getManifestExtension(data: {packageName: string, version: string}) {
  return {
    "url": "implementationGuide",
    "extension": [
      {
        "url": "name",
        "valueString": data.packageName
      }, {
        "url": "version",
        "valueString": data.version
      }
    ]
  }
}

const capabilityStatement = {
  "resourceType": "CapabilityStatement",
  "id": "apim-electronic-prescription-service",
  "name": "EPS FHIR API",
  "status": "active",
  "date": "2021-08-13T00:00:00+00:00",
  "publisher": "digital.nhs.uk",
  "kind": "instance",
  "implementationGuide":  [
    "https://simplifier.net/guide/digitalmedicines",
    "https://simplifier.net/guide/nhsdigital"
  ],
  "extension": [
    {
      "url": "https://fhir.nhs.uk/StructureDefinition/Extension-NHSDigital-APIDefinition",
      "extension": MANIFEST.map(getManifestExtension)
    }
  ],
  "fhirVersion": "4.0.1",
  "format":  [
    "application/fhir+json"
  ],
  "software": [
    {
      "name": "EPS FHIR API",
      "version": VERSION ?? "default"
    }
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
          "type": "Bundle"
        },
        {
          "type": "MedicationRequest",
          "profile": "https://fhir.nhs.uk/StructureDefinition/NHSDigital-MedicationRequest"
        },
        {
          "type": "MedicationDispense",
          "profile": "https://fhir.nhs.uk/StructureDefinition/NHSDigital-MedicationDispense"
        },
        {
          "type": "Medication",
          "profile": "https://fhir.hl7.org.uk/StructureDefinition/UKCore-Medication"
        },
        {
          "type": "Task",
          "profile": "https://fhir.nhs.uk/StructureDefinition/NHSDigital-Task"
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
          "definition": "https://fhir.nhs.uk/MessageDefinition/dispense-notification"
        },
        {
          "mode": "receiver",
          "definition": "https://fhir.nhs.uk/MessageDefinition/dispense-notification-update"
        },
        {
          "mode": "receiver",
          "definition": "https://fhir.nhs.uk/MessageDefinition/dispense-claim"
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

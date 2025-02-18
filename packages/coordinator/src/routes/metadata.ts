import Hapi, {RouteDefMethods} from "@hapi/hapi"
import * as fs from "fs"
import path from "path"
import pino from "pino"
import {isEpsHostedContainer} from "../utils/feature-flags"

const VERSION = process.env.DEPLOYED_VERSION

function readManifestFile(logger: pino.Logger) {
  try {
    logger.info("Attempt reading file.")
    return fs.readFileSync(path.join(__dirname, "../resources/validator_manifest.json"), "utf-8")
  } catch (err){
    logger.error(err)
    return JSON.stringify([])
  }
}

type Manifest = Array<Package>

interface Package {
  packageName: string
  version: string
}

function getManifestExtension(data: Package) {
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

function createCombinedCapabilityStatement(manifest: Manifest) {
  return {
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
        "extension": manifest.map(getManifestExtension)
      }
    ],
    "fhirVersion": "4.0.1",
    "format":  [
      "application/fhir+json"
    ],
    "software": {
      "name": "EPS FHIR API",
      "version": VERSION ?? "default"
    },
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
}

function createPrescribingCapabilityStatement(manifest: Manifest) {
  return {
    "resourceType": "CapabilityStatement",
    "id": "apim-fhir-prescribing-service",
    "name": "FHIR Prescribing API",
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
        "extension": manifest.map(getManifestExtension)
      }
    ],
    "fhirVersion": "4.0.1",
    "format":  [
      "application/fhir+json"
    ],
    "software": {
      "name": "FHIR Prescribing API",
      "version": VERSION ?? "default"
    },
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
            "definition": "https://fhir.nhs.uk/MessageDefinition/prepare"
          },
          {
            "mode": "receiver",
            "definition": "https://fhir.nhs.uk/MessageDefinition/prescription-order"
          },
          {
            "mode": "receiver",
            "definition": "https://fhir.nhs.uk/MessageDefinition/prescription-order-update"
          }
        ]
      }
    ]
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function createDispensingCapabilityStatement(manifest: Manifest) {
  return {
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
        "extension": manifest.map(getManifestExtension)
      }
    ],
    "fhirVersion": "4.0.1",
    "format":  [
      "application/fhir+json"
    ],
    "software": {
      "name": "EPS FHIR API",
      "version": VERSION ?? "default"
    },
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
            "name": "release-message",
            "definition": "http://hl7.org/fhir/OperationDefinition/MessageHeader-release-message"
          },
          {
            "name": "dispense-notification",
            "definition": "https://fhir.nhs.uk/OperationDefinition/MessageHeader-dispense-notification-message"
          },
          {
            "name": "claim",
            "definition": "https://fhir.nhs.uk/OperationDefinition/MessageHeader-claim-message"
          },
          {
            "name": "return",
            "definition": "https://fhir.nhs.uk/OperationDefinition/MessageHeader-return-message"
          },
          {
            "name": "withdraw",
            "definition": "https://fhir.nhs.uk/OperationDefinition/MessageHeader-withdraw-message"
          }
        ]
      }
    ],
    "messaging":  [
      {
        "supportedMessage":  [
          {
            "mode": "receiver",
            "definition": "https://fhir.nhs.uk/MessageDefinition/release"
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
}

export default [{
  method: "GET" as RouteDefMethods,
  path: "/metadata",
  handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
    const manifest = JSON.parse(readManifestFile(request.logger))
    if (isEpsHostedContainer()) {
      return h.response({
        capabilityStatement: createPrescribingCapabilityStatement(manifest)
      }).code(200)
    }
    return h.response({
      capabilityStatement: createCombinedCapabilityStatement(manifest)
    }).code(200)
  }
}]

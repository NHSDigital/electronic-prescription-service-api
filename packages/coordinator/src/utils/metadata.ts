import Hapi from "@hapi/hapi"
import * as fs from "fs"
import path from "path"
import pino from "pino"
import {isEpsHostedContainer} from "../utils/feature-flags"
import {getProxyName, ProxyName} from "../utils/headers"

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

function createTemplateCapabilityStatement(
  manifest: Manifest,
  manifestName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resource: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  operation: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messaging: any
) {
  return {
    "resourceType": "CapabilityStatement",
    "id": "apim-electronic-prescription-service",
    "name": manifestName,
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
      "name": manifestName,
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
        "resource": resource,
        "operation":  operation
      }
    ],
    "messaging": messaging
  }
}

function createCombinedCapabilityStatement(manifest: Manifest) {
  const resource = [
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
  ]
  const operation = [
    {
      "name": "process-message",
      "definition": "http://hl7.org/fhir/OperationDefinition/MessageHeader-process-message"
    },
    {
      "name": "prepare",
      "definition": "https://fhir.nhs.uk/OperationDefinition/MessageHeader-prepare-message"
    }
  ]
  const messaging = [
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
  return createTemplateCapabilityStatement(manifest, "EPS FHIR API", resource, operation, messaging)
}

function createPrescribingCapabilityStatement(manifest: Manifest) {
  const resource = [
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
  ]
  const operation = [
    {
      "name": "process-message",
      "definition": "http://hl7.org/fhir/OperationDefinition/MessageHeader-process-message"
    },
    {
      "name": "prepare",
      "definition": "https://fhir.nhs.uk/OperationDefinition/MessageHeader-prepare-message"
    }
  ]
  const messaging = [
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
  return createTemplateCapabilityStatement(manifest, "FHIR Prescribing API", resource, operation, messaging)
}

function createDispensingCapabilityStatement(manifest: Manifest) {
  const resource = [
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
  ]
  const operation = [
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
  const messaging = [
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

  return createTemplateCapabilityStatement(manifest, "FHIR Dispensing API", resource, operation, messaging)

}

export function getCapabilityStatement(
  logger: pino.Logger,
  headers: Hapi.Utils.Dictionary<string>
) {
  const manifest = JSON.parse(readManifestFile(logger))
  if (isEpsHostedContainer()) {
    const applicationName = getProxyName(headers)
    if (applicationName === ProxyName.EPS_FHIR_DISPENSING) {
      return createDispensingCapabilityStatement(manifest)
    }
    if (applicationName === ProxyName.EPS_FHIR_PRESCRIBING) {
      return createPrescribingCapabilityStatement(manifest)
    }
    return null
  }
  return createCombinedCapabilityStatement(manifest)
}

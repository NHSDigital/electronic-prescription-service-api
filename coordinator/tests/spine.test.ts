import {specification} from "./resources/test-resources"
import {generateResourceId} from "../src/services/translation/cancellation/common"
import {
  getMedicationRequests,
  getMessageHeader
} from "../src/services/translation/common/getResourcesOfType"
import * as fs from "fs"
import * as path from "path"
import * as fhir from "../src/models/fhir/fhir-resources"
import {getExtensionForUrl} from "../src/services/translation/common"
import * as LosslessJson from "lossless-json"

function generateCancelMessage(requestPayload: fhir.Bundle, x: string) {
  const cancelMessage = JSON.parse(JSON.stringify(requestPayload))
  cancelMessage.identifier.value = generateResourceId()
  const cancelMessageHeader = getMessageHeader(cancelMessage)
  cancelMessageHeader.eventCoding.code = "prescription-order-update"
  cancelMessageHeader.eventCoding.display = "Prescription Order Update"
  const cancelMessageMedicationRequest = getMedicationRequests(cancelMessage)
  cancelMessageMedicationRequest[0].statusReason = getStatusReason("0001")

  const bundleEntries = cancelMessage.entry.filter(
    (bluh: fhir.BundleEntry) => bluh.resource.resourceType !== "Practitioner"
  )
  bundleEntries.push(practitionerStuffMap.get(x))
  cancelMessage.entry = bundleEntries

  return cancelMessage
}

function convertPrescriber(defaultPrescriptionMessage: fhir.Bundle, x: string) {
  const prescriptionTypeUrl = "https://fhir.nhs.uk/R4/StructureDefinition/Extension-DM-prescriptionType"

  const prescriptionMessage = JSON.parse(JSON.stringify(defaultPrescriptionMessage))
  prescriptionMessage.identifier.value = generateResourceId()

  const medicationRequest = getMedicationRequests(prescriptionMessage)
  const prescriptionTypeExtension = getExtensionForUrl(
    medicationRequest[0].extension, prescriptionTypeUrl, ""
  ) as fhir.CodingExtension
  prescriptionTypeExtension.valueCoding = prescriptionTypeExtensionMap.get(x)
  medicationRequest[0].authoredOn = new Date().toISOString()

  const bundleEntries = prescriptionMessage.entry.filter(
    (entry: fhir.BundleEntry) => entry.resource.resourceType !== "Practitioner"
      && entry.resource.resourceType !== "PractitionerRole")
  bundleEntries.push(practitionerStuffMap.get(x))
  bundleEntries.push(practitionerRoleStuffMap.get(x))
  prescriptionMessage.entry = bundleEntries

  return prescriptionMessage
}

const prescriptionTypeExtensionMap = new Map()
prescriptionTypeExtensionMap.set("doctor", {
  "system": "https://fhir.nhs.uk/CodeSystem/prescription-type",
  "code": "1001",
  "display": "Outpatient Community Prescriber - Medical Prescriber"
})
prescriptionTypeExtensionMap.set("nurse", {
  "system": "https://fhir.nhs.uk/CodeSystem/prescription-type",
  "code": "1004",
  "display": "Outpatient Community Prescriber - Nurse Independent/Supplementary prescriber"
})
prescriptionTypeExtensionMap.set("pharmacist", {
  "system": "https://fhir.nhs.uk/CodeSystem/prescription-type",
  "code": "1008",
  "display": "Outpatient Community Prescriber - Pharmacist Independent/Supplementary prescriber"
})

const practitionerRoleStuffMap = new Map()
practitionerRoleStuffMap.set("doctor", {
  "fullUrl": "urn:uuid:56166769-c1c4-4d07-afa8-132b5dfca666",
  "resource": {
    "resourceType": "PractitionerRole",
    "id": "56166769-c1c4-4d07-afa8-132b5dfca666",
    "identifier": [
      {
        "system": "https://fhir.nhs.uk/Id/sds-role-profile-id",
        "value": "601986680555"
      },
      {
        "system": "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code",
        "value": "683458"
      }
    ],
    "practitioner": {
      "reference": "urn:uuid:a8c85454-f8cb-498d-9629-78e2cb5fa47a"
    },
    "organization": {
      "reference": "urn:uuid:3b4b03a5-52ba-4ba6-9b82-70350aa109d8"
    },
    "code": [
      {
        "coding": [
          {
            "system": "https://fhir.nhs.uk/R4/CodeSystem/UKCore-SDSJobRoleName",
            "code": "R8000",
            "display": "Clinical Practitioner Access Role "
          }
        ]
      }
    ],
    "healthcareService": [
      {
        "reference": "urn:uuid:54b0506d-49af-4245-9d40-d7d64902055e",
        "display": "SOMERSET BOWEL CANCER SCREENING CENTRE"
      }
    ],
    "telecom": [
      {
        "system": "phone",
        "value": "01234567890",
        "use": "work"
      }
    ]
  }
})
practitionerRoleStuffMap.set("nurse", {
  "fullUrl": "urn:uuid:56166769-c1c4-4d07-afa8-132b5dfca666",
  "resource": {
    "resourceType": "PractitionerRole",
    "id": "56166769-c1c4-4d07-afa8-132b5dfca666",
    "identifier": [
      {
        "system": "https://fhir.nhs.uk/Id/sds-role-profile-id",
        "value": "100102238986"
      },
      {
        "system": "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code",
        "value": "12A3456B"
      }
    ],
    "practitioner": {
      "reference": "urn:uuid:a8c85454-f8cb-498d-9629-78e2cb5fa47a"
    },
    "organization": {
      "reference": "urn:uuid:3b4b03a5-52ba-4ba6-9b82-70350aa109d8"
    },
    "code": [
      {
        "coding": [
          {
            "system": "https://fhir.nhs.uk/R4/CodeSystem/UKCore-SDSJobRoleName",
            "code": "R8001",
            "display": "Nurse Access Role"
          }
        ]
      }
    ],
    "healthcareService": [
      {
        "reference": "urn:uuid:54b0506d-49af-4245-9d40-d7d64902055e",
        "display": "SOMERSET BOWEL CANCER SCREENING CENTRE"
      }
    ],
    "telecom": [
      {
        "system": "phone",
        "value": "01234567890",
        "use": "work"
      }
    ]
  }
})
practitionerRoleStuffMap.set("pharmacist", {
  "fullUrl": "urn:uuid:56166769-c1c4-4d07-afa8-132b5dfca666",
  "resource": {
    "resourceType": "PractitionerRole",
    "id": "56166769-c1c4-4d07-afa8-132b5dfca666",
    "identifier": [
      {
        "system": "https://fhir.nhs.uk/Id/sds-role-profile-id",
        "value": "201715352555"
      },
      {
        "system": "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code",
        "value": "2083469"
      }
    ],
    "practitioner": {
      "reference": "urn:uuid:a8c85454-f8cb-498d-9629-78e2cb5fa47a"
    },
    "organization": {
      "reference": "urn:uuid:3b4b03a5-52ba-4ba6-9b82-70350aa109d8"
    },
    "code": [
      {
        "coding": [
          {
            "system": "https://fhir.nhs.uk/R4/CodeSystem/UKCore-SDSJobRoleName",
            "code": "R8003",
            "display": "Health Professional Access Role"
          }
        ]
      }
    ],
    "healthcareService": [
      {
        "reference": "urn:uuid:54b0506d-49af-4245-9d40-d7d64902055e",
        "display": "SOMERSET BOWEL CANCER SCREENING CENTRE"
      }
    ],
    "telecom": [
      {
        "system": "phone",
        "value": "01234567890",
        "use": "work"
      }
    ]
  }
})

const practitionerStuffMap = new Map()
practitionerStuffMap.set("doctor", {
  "fullUrl": "urn:uuid:a8c85454-f8cb-498d-9629-78e2cb5fa47a",
  "resource": {
    "resourceType": "Practitioner",
    "id": "a8c85454-f8cb-498d-9629-78e2cb5fa47a",
    "identifier": [
      {
        "system": "https://fhir.nhs.uk/Id/sds-user-id",
        "value": "555086689106"
      },
      {
        "system": "https://fhir.hl7.org.uk/Id/gmc-number",
        "value": "6150129"
      }
    ],
    "name": [
      {
        "family": "FIFTYSEVEN",
        "given": [
          "RANDOM"
        ],
        "prefix": [
          "MR"
        ]
      }
    ]
  }
})
practitionerStuffMap.set("nurse", {
  "fullUrl": "urn:uuid:a8c85454-f8cb-498d-9629-78e2cb5fa47a",
  "resource": {
    "resourceType": "Practitioner",
    "id": "a8c85454-f8cb-498d-9629-78e2cb5fa47a",
    "identifier": [
      {
        "system": "https://fhir.nhs.uk/Id/sds-user-id",
        "value": "555086690109"
      },
      {
        "system": "https://fhir.hl7.org.uk/Id/nmc-number",
        "value": "12A3456B"
      }
    ],
    "name": [
      {
        "family": "Userq",
        "given": [
          "Random"
        ],
        "prefix": [
          "MR"
        ]
      }
    ]
  }
})
practitionerStuffMap.set("pharmacist", {
  "fullUrl": "urn:uuid:a8c85454-f8cb-498d-9629-78e2cb5fa47a",
  "resource": {
    "resourceType": "Practitioner",
    "id": "a8c85454-f8cb-498d-9629-78e2cb5fa47a",
    "identifier": [
      {
        "system": "https://fhir.nhs.uk/Id/sds-user-id",
        "value": "55253517102"
      },
      {
        "system": "https://fhir.hl7.org.uk/Id/gphc-number",
        "value": "2083469"
      }
    ],
    "name": [
      {
        "family": "UserM",
        "given": [
          "RANDOM"
        ],
        "prefix": [
          "MR"
        ]
      }
    ]
  }
})

describe("generate prescription-order and prescription-order-update messages", () => {
  const cases = [
    ["nurse", "nurse"],
    ["nurse", "doctor"],
    ["nurse", "pharmacist"],
    ["doctor", "nurse"],
    ["doctor", "doctor"],
    ["doctor", "pharmacist"],
    ["pharmacist", "nurse"],
    ["pharmacist", "doctor"],
    ["pharmacist", "pharmacist"]
  ]

  test.each(cases)("^", async (prescriber: string, canceller: string) => {
    const prescriptionMessage = specification[1].fhirMessageSigned
    const medicationRequest = getMedicationRequests(prescriptionMessage)
    const shortFormId = generateShortFormID()
    medicationRequest[0].groupIdentifier.value = shortFormId

    const convertedPrescriptionMessage = convertPrescriber(prescriptionMessage, prescriber)
    fs.writeFileSync(
      path.join(__dirname, `${shortFormId+prescriber+canceller}-prescription-order.json`),
      LosslessJson.stringify(convertedPrescriptionMessage), "utf-8"
    )

    fs.writeFileSync(
      path.join(__dirname, `${shortFormId+prescriber+canceller}-prescription-order-update.json`),
      LosslessJson.stringify(generateCancelMessage(convertedPrescriptionMessage, canceller)), "utf-8"
    )
  })
})

function getStatusReason(statusCode: string) {
  return {
    "coding": [
      {
        "system": "https://fhir.nhs.uk/CodeSystem/medicationrequest-status-reason",
        "code": statusCode,
        "display": statusCode === "0001" ? "Prescribing Error" : ""
      }
    ]
  }
}

function generateShortFormID() {
  const _PRESC_CHECKDIGIT_VALUES = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ+"
  const hexString = (generateResourceId()).replace(/-/g, "").toUpperCase()
  let prescriptionID = hexString.substring(0, 6) + "-" + "A99968" + "-" + hexString.substring(12, 17)
  const prscID = prescriptionID.replace(/-/g, "")
  const prscIDLength = prscID.length
  let runningTotal = 0
  let checkValue
  const strings = prscID.split("")
  strings.forEach((character, index) => {
    runningTotal = runningTotal + parseInt(character, 36) * (2 ** (prscIDLength - index))
  })
  checkValue = (38 - runningTotal % 37) % 37
  checkValue = _PRESC_CHECKDIGIT_VALUES.substring(checkValue, checkValue+1)
  prescriptionID += checkValue
  return prescriptionID
}

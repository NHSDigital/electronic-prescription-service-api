import * as fhirCommon from "../models/common"
import {
  EventCodingCode,
  BundleEntry,
  MedicationDispense,
  Bundle,
  RepeatInformationExtension,
  MedicationRequest,
  MedicationRequestGroupIdentifier
} from "../models"
import {
  getMedicationRequestBundleEntries,
  getMessageHeaderResources,
  getPatientBundleEntries,
  isRepeatDispensing
} from "../parsers/read/bundle-parser"
import {getNhsNumber} from "../parsers/read/patient-parser"
import * as fhirExtension from "../models/extension"
import {getLongFormIdExtension} from "../parsers/read/extensions-parser"
import {createUuidIdentifier} from "./common"

export function createDispenseRequest(bundle: Bundle): Bundle {
  // Fixes duplicate hl7v3 identifier error
  // this is not an obvious error for a supplier to resolve as
  // there is no mention of the fhir field it relates to
  // can we improve our returned error message here??
  bundle.identifier = createUuidIdentifier()
  // ****************************************

  const messageHeader = getMessageHeaderResources(bundle)[0]
  messageHeader.eventCoding.code = EventCodingCode.DISPENSE
  messageHeader.eventCoding.display = "Dispense Notification"

  // remove focus references as references not in bundle causes validation errors
  // but no references always passes
  messageHeader.focus = []
  // ****************************************

  const clonedHeaderEntry = JSON.parse(
    JSON.stringify(
      bundle.entry.filter(e => e.resource.resourceType === "MessageHeader")[0]
    )
  )
  clonedHeaderEntry.resource.response = {
    identifier: "999f9999-9999-9999-9ff9-f9fff9999999",
    code: "ok"
  }

  const medicationToDispenseSnomed = (document.querySelectorAll(
    'input[name="dispense-medications"]:checked'
  )[0] as HTMLInputElement).value
  const medicationRequestEntries = getMedicationRequestBundleEntries(bundle.entry)

  const medicationDispenseEntries = medicationRequestEntries.map(medicationRequestEntry => {
    const medicationDispenseEntry = {} as BundleEntry
    medicationDispenseEntry.fullUrl = medicationRequestEntry.fullUrl
    medicationDispenseEntry.resource = {} as fhirCommon.Resource
    const medicationDispense = medicationDispenseEntry.resource as MedicationDispense
    medicationDispense.resourceType = "MedicationDispense"
    medicationDispense.extension = []
    const medicationRequest = medicationRequestEntry.resource
    if (isRepeatDispensing(bundle)) {
      const dispensingRepeatInformationExtension = createDispensingRepeatInformationExtension(medicationRequest)
      medicationDispense.extension.push(dispensingRepeatInformationExtension)
    }
    medicationDispense.identifier = [
      {
        system: "https://fhir.nhs.uk/Id/prescription-dispense-item-number",
        value: medicationRequestEntry.fullUrl.replace("urn:uuid:", "")
      }
    ]
    medicationDispense.medicationCodeableConcept =
    medicationRequest.medicationCodeableConcept
    const patientEntry = getPatientBundleEntries(bundle.entry)[0]
    medicationDispense.subject = {
      type: "Patient",
      identifier: {
        system: "https://fhir.nhs.uk/Id/nhs-number",
        value: getNhsNumber(patientEntry)
      }
    }
    const groupIdentifier = medicationRequest.groupIdentifier
    medicationDispense.authorizingPrescription = [
      {
        extension: [
          createGroupIdentifierExtension(groupIdentifier)
        ],
        identifier: {
          system: "https://fhir.nhs.uk/Id/prescription-order-item-number",
          value: medicationRequestEntry.fullUrl.replace("urn:uuid:", "")
        }
      }
    ]
    medicationDispense.performer = [
      {
        actor: {
          type: "Practitioner",
          identifier: {
            system: "https://fhir.hl7.org.uk/Id/gphc-number",
            value: "7654321"
          },
          display: "Mr Peter Potion"
        }
      },
      {
        actor: {
          type: "Organization",
          identifier: {
            system: "https://fhir.nhs.uk/Id/ods-organization-code",
            value: "VNFKT"
          },
          display: "FIVE STAR HOMECARE LEEDS LTD"
        }
      }
    ]
    medicationDispense.whenPrepared = "2021-07-07T15:43:00+00:00"
    medicationDispense.dosageInstruction = [
      {
        text: "4 times a day for 7 days"
      }
    ]
    medicationDispense.quantity = medicationRequest.dispenseRequest?.quantity ?? undefined

    const medicationRequestEntryToDispense = medicationRequest.medicationCodeableConcept.coding.some(
      c => c.code === medicationToDispenseSnomed
    )
    if (medicationRequestEntryToDispense) {
      const taskBusinessStatusExtension = createTaskBusinessStatusExtension(true)
      medicationDispense.extension.push(taskBusinessStatusExtension)
      medicationDispense.status = "completed"
      medicationDispense.type = {
        coding: [
          {
            system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-type",
            code: "0001",
            display: "Item fully dispensed"
          }
        ]
      }
    } else {
      const taskBusinessStatusExtension = createTaskBusinessStatusExtension(false)
      medicationDispense.extension.push(taskBusinessStatusExtension)
      medicationDispense.status = "in-progress"
      medicationDispense.type = {
        coding: [
          {
            system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-type",
            code: "0002",
            display: "Item not dispensed"
          }
        ]
      }
    }
    return medicationDispenseEntry
  })

  bundle.entry = []
  bundle.entry.push(clonedHeaderEntry)
  medicationDispenseEntries.forEach(medicationDispenseEntry => {
    bundle.entry.push(medicationDispenseEntry)
  })
  return bundle
}

function createDispensingRepeatInformationExtension(
  medicationRequest: MedicationRequest
) {
  const repeatInformationExtension = medicationRequest.extension.find(e =>
    e.url === "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation"
  ) as RepeatInformationExtension

  //TODO - We should be building the dispense notification from the release response, not the prescription order request.
  // If we did that, we'd have information like the issue number. For now, allow the issue number to be entered manually.
  // const numberOfRepeatPrescriptionsIssuedExtension = repeatInformationExtension.extension.find(e =>
  //     e.url === "numberOfRepeatPrescriptionsIssued"
  // ) as fhirExtension.UnsignedIntExtension
  // const numberOfRepeatPrescriptionsIssued = numberOfRepeatPrescriptionsIssuedExtension.valueUnsignedInt
  const issueNumberStr = (document.getElementById("issue-number") as HTMLInputElement).value
  const numberOfRepeatPrescriptionsIssued = parseInt(issueNumberStr, 10)

  const numberOfRepeatPrescriptionsAllowedExtension = repeatInformationExtension.extension.find(e =>
    e.url === "numberOfRepeatPrescriptionsAllowed"
  ) as fhirExtension.UnsignedIntExtension
  const numberOfRepeatPrescriptionsAllowed = numberOfRepeatPrescriptionsAllowedExtension.valueUnsignedInt

  return {
    url: "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-RepeatInformation",
    extension: [
      {
        url: "numberOfRepeatsIssued",
        valueInteger: numberOfRepeatPrescriptionsIssued
      } as fhirExtension.IntegerExtension,
      {
        url: "numberOfRepeatsAllowed",
        valueInteger: numberOfRepeatPrescriptionsAllowed
      } as fhirExtension.IntegerExtension
    ]
  }
}

function createGroupIdentifierExtension(groupIdentifier: MedicationRequestGroupIdentifier) {
  return {
    url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-GroupIdentifier",
    extension: [
      {
        url: "shortForm",
        valueIdentifier: {
          system: "https://fhir.nhs.uk/Id/prescription-order-number",
          value: groupIdentifier.value
        }
      },
      {
        url: "UUID",
        valueIdentifier: {
          system: "https://fhir.nhs.uk/Id/prescription",
          value: getLongFormIdExtension(groupIdentifier.extension).valueIdentifier.value
        }
      }
    ]
  }
}

function createTaskBusinessStatusExtension(fullyDispensed: boolean) {
  return {
    url:
        "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-TaskBusinessStatus",
    valueCoding: {
      system: "https://fhir.nhs.uk/CodeSystem/EPS-task-business-status",
      code: fullyDispensed ? "0006" : "0003",
      display: fullyDispensed ? "Dispensed" : "With Dispenser - Active"
    }
  }
}

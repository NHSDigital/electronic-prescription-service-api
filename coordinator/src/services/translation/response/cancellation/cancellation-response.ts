import {
  createMedicationRequest,
  extractStatusCode,
  PrescriptionStatusInformation
} from "./cancellation-medication-request"
import {createMessageHeader} from "../message-header"
import {isDeepStrictEqual} from "util"
import {convertResourceToBundleEntry, translateAndAddAgentPerson, translateAndAddPatient} from "../common"
import {convertHL7V3DateTimeToIsoDateTimeString} from "../../common/dateTime"
import {fhir, hl7V3} from "@models"

export function translateSpineCancelResponseIntoBundle(cancellationResponse: hl7V3.CancellationResponse): fhir.Bundle {
  return {
    resourceType: "Bundle",
    type: "message",
    identifier: createBundleIdentifier(cancellationResponse),
    timestamp: convertHL7V3DateTimeToIsoDateTimeString(cancellationResponse.effectiveTime),
    entry: createBundleEntries(cancellationResponse)
  }
}

export function translateSpineCancelResponseIntoOperationOutcome(
  prescriptionStatusInformation: PrescriptionStatusInformation): fhir.OperationOutcome {
  return {
    resourceType: "OperationOutcome",
    issue: [{
      severity: "error",
      code: prescriptionStatusInformation.issueCode,
      details: {
        coding: [{
          system: "https://fhir.nhs.uk/CodeSystem/medicationrequest-status-history",
          code: prescriptionStatusInformation.prescriptionStatusCode,
          display: prescriptionStatusInformation.prescriptionStatusDisplay
        }]
      }
    }]
  }
}

export function translateSpineCancelResponse (cancellationResponse: hl7V3.CancellationResponse):
  fhir.Bundle | fhir.OperationOutcome {
  const prescriptionStatusInformation = extractStatusCode(cancellationResponse)
  if (prescriptionStatusInformation.issueCode) {
    return translateSpineCancelResponseIntoOperationOutcome(prescriptionStatusInformation)
  } else {
    return translateSpineCancelResponseIntoBundle(cancellationResponse)
  }
}

function createBundleEntries(cancellationResponse: hl7V3.CancellationResponse) {
  const unorderedBundleResources: Array<fhir.Resource> = []

  const patient = cancellationResponse.recordTarget.Patient
  const patientId = translateAndAddPatient(patient, unorderedBundleResources)

  //The Author represents the author of the cancel request, not necessarily the author of the original prescription
  const authorAgentPerson = cancellationResponse.author.AgentPerson
  const cancelRequesterId = translateAndAddAgentPerson(authorAgentPerson, unorderedBundleResources)

  //The ResponsibleParty represents the author of the original prescription (if different to the cancel requester)
  const responsiblePartyAgentPerson = cancellationResponse.responsibleParty?.AgentPerson
  let originalPrescriptionAuthorId = cancelRequesterId
  if (responsiblePartyAgentPerson && !isDeepStrictEqual(responsiblePartyAgentPerson, authorAgentPerson)) {
    originalPrescriptionAuthorId = translateAndAddAgentPerson(responsiblePartyAgentPerson, unorderedBundleResources)
  }

  const medicationRequest = createMedicationRequest(
    cancellationResponse,
    cancelRequesterId,
    patientId,
    originalPrescriptionAuthorId
  )

  const representedOrganizationId = authorAgentPerson.representedOrganization.id._attributes.extension
  const messageId = cancellationResponse.id._attributes.root
  const cancelRequestId = cancellationResponse.pertinentInformation4.pertinentCancellationRequestRef.id._attributes.root
  const messageHeader = createMessageHeader(
    messageId,
    fhir.EVENT_CODING_PRESCRIPTION_ORDER_RESPONSE,
    [patientId, medicationRequest.id],
    representedOrganizationId,
    cancelRequestId
  )

  const orderedBundleResources = [
    messageHeader,
    medicationRequest,
    ...unorderedBundleResources
  ]

  if (cancellationResponse.performer) {
    const performerAgentPerson = cancellationResponse.performer.AgentPerson
    let performerId
    if (isDeepStrictEqual(performerAgentPerson, authorAgentPerson)) {
      performerId = cancelRequesterId
    } else if (isDeepStrictEqual(performerAgentPerson, responsiblePartyAgentPerson)) {
      performerId = originalPrescriptionAuthorId
    } else {
      performerId = translateAndAddAgentPerson(performerAgentPerson, orderedBundleResources)
    }
    const performerOrganizationCode = performerAgentPerson.representedOrganization.id._attributes.extension
    const performerOrganizationName = performerAgentPerson.representedOrganization.name._text
    medicationRequest.dispenseRequest = createDispenserInfoReference(
      performerId, performerOrganizationCode, performerOrganizationName
    )
  }

  return orderedBundleResources.map(convertResourceToBundleEntry)
}

function createDispenserInfoReference(practitionerId: string, organizationCode: string, organizationName: string) {
  return {
    performer: {
      extension:  [
        {
          url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-DispensingPerformer",
          valueReference: fhir.createReference(practitionerId)
        }
      ],
      identifier: fhir.createIdentifier("https://fhir.nhs.uk/Id/ods-organization-code", organizationCode),
      display: organizationName
    }
    //TODO: does this reference & identifier need a display name? if so, how to show?
  }
}

function createBundleIdentifier(cancellationResponse: hl7V3.CancellationResponse) {
  return {
    system: "https://tools.ietf.org/html/rfc4122",
    value: cancellationResponse.id._attributes.root.toLowerCase()
  }
}

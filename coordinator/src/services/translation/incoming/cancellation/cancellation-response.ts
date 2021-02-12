import * as fhir from "../../../../models/fhir/fhir-resources"
import {CancellationResponse} from "../../../../models/hl7-v3/hl7-v3-spine-response"
import {createMedicationRequest} from "./cancellation-medication-request"
import {createMessageHeader} from "../message-header"
import {convertHL7V3DateTimeToIsoDateTimeString} from "../../common"
import {createIdentifier, createReference} from "../fhir-base-types"
import {isDeepStrictEqual} from "util"
import {convertResourceToBundleEntry, translateAndAddAgentPerson, translateAndAddPatient} from "../common"

export function translateSpineCancelResponseIntoBundle(cancellationResponse: CancellationResponse): fhir.Bundle {
  return {
    resourceType: "Bundle",
    type: "message",
    identifier: createBundleIdentifier(cancellationResponse),
    timestamp: convertHL7V3DateTimeToIsoDateTimeString(cancellationResponse.effectiveTime),
    entry: createBundleEntries(cancellationResponse)
  }
}

function createBundleEntries(cancellationResponse: CancellationResponse) {
  const unorderedBundleResources: Array<fhir.Resource> = []

  const hl7Patient = cancellationResponse.recordTarget.Patient
  const patientId = translateAndAddPatient(hl7Patient, unorderedBundleResources)

  //The Author represents the author of the cancel request, not necessarily the author of the original prescription
  const hl7AuthorAgentPerson = cancellationResponse.author.AgentPerson
  const cancelRequesterId = translateAndAddAgentPerson(hl7AuthorAgentPerson, unorderedBundleResources)

  //The ResponsibleParty represents the author of the original prescription (if different to the cancel requester)
  const hl7ResponsiblePartyAgentPerson = cancellationResponse.responsibleParty?.AgentPerson
  let originalPrescriptionAuthorId = cancelRequesterId
  if (hl7ResponsiblePartyAgentPerson && !isDeepStrictEqual(hl7ResponsiblePartyAgentPerson, hl7AuthorAgentPerson)) {
    originalPrescriptionAuthorId = translateAndAddAgentPerson(hl7ResponsiblePartyAgentPerson, unorderedBundleResources)
  }

  const fhirMedicationRequest = createMedicationRequest(
    cancellationResponse,
    cancelRequesterId,
    patientId,
    originalPrescriptionAuthorId
  )

  const representedOrganizationId = hl7AuthorAgentPerson.representedOrganization.id._attributes.extension
  const messageId = cancellationResponse.id._attributes.root
  const cancelRequestId = cancellationResponse.pertinentInformation4.pertinentCancellationRequestRef.id._attributes.root
  const fhirMessageHeader = createMessageHeader(
    messageId,
    [patientId, fhirMedicationRequest.id],
    representedOrganizationId,
    cancelRequestId
  )

  const orderedBundleResources = [
    fhirMessageHeader,
    fhirMedicationRequest,
    ...unorderedBundleResources
  ]

  if (cancellationResponse.performer) {
    const performerAgentPerson = cancellationResponse.performer.AgentPerson
    let performerId
    if (isDeepStrictEqual(performerAgentPerson, hl7AuthorAgentPerson)) {
      performerId = cancelRequesterId
    } else if (isDeepStrictEqual(performerAgentPerson, hl7ResponsiblePartyAgentPerson)) {
      performerId = originalPrescriptionAuthorId
    } else {
      performerId = translateAndAddAgentPerson(performerAgentPerson, orderedBundleResources)
    }
    const performerOrganizationCode = performerAgentPerson.representedOrganization.id._attributes.extension
    const performerOrganizationName = performerAgentPerson.representedOrganization.name._text
    fhirMedicationRequest.dispenseRequest = createDispenserInfoReference(
      performerId, performerOrganizationCode, performerOrganizationName
    )
  }

  return orderedBundleResources.map(convertResourceToBundleEntry)
}

// TODO - consider building up the list and sorting afterwards, e.g.:
//
// function sorted(resources: Array<fhir.Resource>) {
//   return resources.sort((a, b) => {
//     const indexA = getIndexForComparison(a)
//     const indexB = getIndexForComparison(b)
//     return Math.sign(indexA - indexB)
//   })
// }
//
// function getIndexForComparison(resource: fhir.Resource) {
//   const resourceOrder = ["MessageHeader", "MedicationRequest", "Patient"]
//   const index = resourceOrder.indexOf(resource.resourceType)
//   return index === -1 ? resourceOrder.length : index
// }

function createDispenserInfoReference(practitionerId: string, organizationCode: string, organizationName: string) {
  return {
    performer: {
      extension:  [
        {
          url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-DispensingPerformer",
          valueReference: createReference(practitionerId)
        }
      ],
      identifier: createIdentifier("https://fhir.nhs.uk/Id/ods-organization-code", organizationCode),
      display: organizationName
    }
    //TODO: does this reference & identifier need a display name? if so, how to show?
  }
}

function createBundleIdentifier(cancellationResponse: CancellationResponse) {
  return {
    system: "https://tools.ietf.org/html/rfc4122",
    value: cancellationResponse.id._attributes.root.toLowerCase()
  }
}

import * as fhir from "../../../models/fhir/fhir-resources"
import {CancellationResponse} from "../../../models/hl7-v3/hl7-v3-spine-response"
import {createMedicationRequest} from "./cancellation-medication-request"
import {createPatient} from "./cancellation-patient"
import {createPractitioner} from "./cancellation-practitioner"
import {createHealthcareService, createLocations} from "./cancellation-organization"
import {createPractitionerRole} from "./cancellation-practitioner-role"
import {createMessageHeader} from "./cancellation-message-header"
import {AgentPerson} from "../../../models/hl7-v3/hl7-v3-people-places"
import {createIdentifier, createReference} from "./fhir-base-types"
import {isDeepStrictEqual} from "util"
import {convertHL7V3DateTimeToIsoDateTimeString} from "../common/dateTime"

export function translateSpineCancelResponseIntoBundle(cancellationResponse: CancellationResponse): fhir.Bundle {
  return {
    resourceType: "Bundle",
    type: "message",
    identifier: createBundleIdentifier(cancellationResponse),
    timestamp: convertHL7V3DateTimeToIsoDateTimeString(cancellationResponse.effectiveTime),
    entry: createBundleEntries(cancellationResponse)
  }
}

function convertAgentPerson(hl7AgentPerson: AgentPerson) {
  const fhirPractitioner = createPractitioner(hl7AgentPerson)
  const fhirLocations = createLocations(hl7AgentPerson.representedOrganization)
  const fhirHealthcareService = createHealthcareService(hl7AgentPerson.representedOrganization, fhirLocations)

  const fhirPractitionerRole = createPractitionerRole(
    hl7AgentPerson,
    fhirPractitioner.id,
    fhirHealthcareService.id
  )
  return {fhirPractitioner, fhirLocations, fhirHealthcareService, fhirPractitionerRole}
}

function convertResourceToBundleEntry(resource: fhir.Resource) {
  return {
    resource,
    fullUrl: `urn:uuid:${resource.id}`
  }
}

function createBundleEntries(cancellationResponse: CancellationResponse) {
  const fhirPatient = createPatient(cancellationResponse.recordTarget.Patient)

  const hl7AuthorAgentPerson = cancellationResponse.author.AgentPerson
  const hl7ResponsiblePartyAgentPerson = cancellationResponse.responsibleParty?.AgentPerson

  const {
    fhirPractitioner: fhirCancelRequesterPractitioner,
    fhirLocations: fhirCancelRequesterLocations,
    fhirHealthcareService: fhirCancelRequesterHealthcareService,
    fhirPractitionerRole: fhirCancelRequesterPractitionerRole
  } = convertAgentPerson(hl7AuthorAgentPerson)

  const unorderedBundleResources: Array<fhir.Resource> = [
    fhirPatient,
    fhirCancelRequesterPractitioner,
    ...fhirCancelRequesterLocations,
    fhirCancelRequesterHealthcareService,
    fhirCancelRequesterPractitionerRole
  ]

  let originalPrescriptionAuthorId = fhirCancelRequesterPractitioner.id

  if (hl7ResponsiblePartyAgentPerson && !isDeepStrictEqual(hl7ResponsiblePartyAgentPerson, hl7AuthorAgentPerson)) {
    const {
      fhirPractitioner: fhirOriginalPrescriptionAuthorPractitioner,
      fhirLocations: fhirOriginalPrescriptionAuthorLocations,
      fhirHealthcareService: fhirOriginalPrescriptionAuthorHealthcareService,
      fhirPractitionerRole: fhirOriginalPrescriptionAuthorPractitionerRole
    } = convertAgentPerson(hl7ResponsiblePartyAgentPerson)

    originalPrescriptionAuthorId = fhirOriginalPrescriptionAuthorPractitionerRole.id

    unorderedBundleResources.push(
      fhirOriginalPrescriptionAuthorPractitioner,
      ...fhirOriginalPrescriptionAuthorLocations,
      fhirOriginalPrescriptionAuthorHealthcareService,
      fhirOriginalPrescriptionAuthorPractitionerRole
    )
  }

  const fhirMedicationRequest = createMedicationRequest(
    cancellationResponse,
    fhirCancelRequesterPractitioner.id,
    fhirPatient.id,
    originalPrescriptionAuthorId
  )

  const representedOrganizationId = hl7AuthorAgentPerson.representedOrganization.id._attributes.extension
  const messageId = cancellationResponse.id._attributes.root
  const cancelRequestId = cancellationResponse.pertinentInformation4.pertinentCancellationRequestRef.id._attributes.root
  const fhirMessageHeader = createMessageHeader(
    messageId,
    fhirPatient.id,
    fhirMedicationRequest.id,
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
      performerId = fhirCancelRequesterPractitioner.id
    } else if (isDeepStrictEqual(performerAgentPerson, hl7ResponsiblePartyAgentPerson)) {
      performerId = originalPrescriptionAuthorId
    } else {
      const {
        fhirPractitioner: fhirPerformerPractitioner,
        fhirLocations: fhirPerformerLocations,
        fhirHealthcareService: fhirPerformerHealthcareService,
        fhirPractitionerRole: fhirPerformerPractitionerRole
      } = convertAgentPerson(performerAgentPerson)
      performerId = fhirPerformerPractitionerRole.id
      orderedBundleResources.push(
        fhirPerformerPractitioner,
        ...fhirPerformerLocations,
        fhirPerformerHealthcareService,
        fhirPerformerPractitionerRole
      )
    }
    const performerOrganizationCode = performerAgentPerson.representedOrganization.id._attributes.extension
    const performerOrganizationName = performerAgentPerson.representedOrganization.name._text
    fhirMedicationRequest.dispenseRequest = createDispenserInfoReference(
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

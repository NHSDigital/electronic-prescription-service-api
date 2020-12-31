import * as fhir from "../../../models/fhir/fhir-resources"
import {CancellationResponse} from "../../../models/hl7-v3/hl7-v3-spine-response"
import {createMedicationRequest} from "./cancellation-medication-request"
import {createPatient} from "./cancellation-patient"
import {createPractitioner} from "./cancellation-practitioner"
import {createHealthcareService, createLocations} from "./cancellation-organization"
import {createPractitionerRole} from "./cancellation-practitioner-role"
import {createMessageHeader} from "./cancellation-message-header"
import {AgentPerson} from "../../../models/hl7-v3/hl7-v3-people-places"
import {convertHL7V3DateTimeToIsoDateTimeString} from "../common"
import {createIdentifier, createReference} from "./fhir-base-types"

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

  const {
    fhirPractitioner: fhirResponsiblePartyPractitioner,
    fhirLocations: fhirResponsiblePartyLocations,
    fhirHealthcareService: fhirResponsiblePartyHealthcareService,
    fhirPractitionerRole: fhirResponsiblePartyPractitionerRole
  } = convertAgentPerson(cancellationResponse.responsibleParty.AgentPerson)

  const {
    fhirPractitioner: fhirAuthorPractitioner,
    fhirLocations: fhirAuthorLocations,
    fhirHealthcareService: fhirAuthorHealthcareService,
    fhirPractitionerRole: fhirAuthorPractitionerRole
  } = convertAgentPerson(cancellationResponse.author.AgentPerson)

  const fhirMedicationRequest = createMedicationRequest(
    cancellationResponse,
    fhirResponsiblePartyPractitioner.id,
    fhirPatient.id,
    fhirAuthorPractitionerRole.id
  )

  const authorRepresentedOrganization = cancellationResponse.author.AgentPerson.representedOrganization
  const representedOrganizationId = authorRepresentedOrganization.id._attributes.extension
  const messageId = cancellationResponse.id._attributes.root
  const cancelRequestId = cancellationResponse.pertinentInformation4.pertinentCancellationRequestRef.id._attributes.root
  const fhirMessageHeader = createMessageHeader(
    messageId,
    fhirPatient.id,
    fhirMedicationRequest.id,
    representedOrganizationId,
    cancelRequestId
  )

  const bundleResources = [
    fhirMessageHeader,
    fhirMedicationRequest,
    fhirPatient,
    fhirAuthorPractitioner,
    ...fhirAuthorLocations,
    fhirAuthorHealthcareService,
    fhirAuthorPractitionerRole,
    fhirResponsiblePartyPractitioner,
    ...fhirResponsiblePartyLocations,
    fhirResponsiblePartyHealthcareService,
    fhirResponsiblePartyPractitionerRole
  ]

  if (cancellationResponse.performer) {
    const performerAgentPerson = cancellationResponse.performer.AgentPerson
    const {
      fhirPractitioner: fhirPerformerPractitioner,
      fhirLocations: fhirPerformerLocations,
      fhirHealthcareService: fhirPerformerHealthcareService,
      fhirPractitionerRole: fhirPerformerPractitionerRole
    } = convertAgentPerson(performerAgentPerson)
    const performerPractitionerRoleId = fhirPerformerPractitionerRole.id
    const performerOrganizationCode = performerAgentPerson.representedOrganization.id._attributes.extension
    const performerOrganizationName = performerAgentPerson.representedOrganization.name._text
    fhirMedicationRequest.dispenseRequest = createDispenserInfoReference(
      performerPractitionerRoleId, performerOrganizationCode, performerOrganizationName
    )
    bundleResources.push(
      fhirPerformerPractitioner,
      ...fhirPerformerLocations,
      fhirPerformerHealthcareService,
      fhirPerformerPractitionerRole
    )
  }

  return bundleResources.map(convertResourceToBundleEntry)
}

function createDispenserInfoReference(practitionerId: string, organizationCode: string, organizationName: string) {
  return {
    performer: {
      extension:  [
        {
          url: "https://fhir.nhs.uk/R4/StructureDefinition/Extension-DispensingPerformer",
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

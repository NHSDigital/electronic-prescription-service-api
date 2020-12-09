import * as fhir from "../../../models/fhir/fhir-resources"
import {CancellationResponse} from "../../../models/hl7-v3/hl7-v3-spine-response"
import {createMedicationRequest} from "./cancellation-medication-request"
import {createPatient} from "./cancellation-patient"
import {createPractitioner} from "./cancellation-practitioner"
import {createOrganization} from "./cancellation-organization"
import {createPractitionerRole} from "./cancellation-practitioner-role"
import {createMessageHeader} from "./cancellation-message-header"
import {AgentPerson} from "../../../models/hl7-v3/hl7-v3-people-places"
import {convertHL7V3DateTimeStringToISODateTime} from "../common"

export function translateSpineCancelResponseIntoBundle(cancellationResponse: CancellationResponse): fhir.Bundle {
  const bundle = new fhir.Bundle()

  bundle.type = "message"
  bundle.identifier = {
    system: "https://tools.ietf.org/html/rfc4122",
    value: cancellationResponse.id._attributes.root.toLowerCase()
  }
  bundle.timestamp = convertHL7V3DateTimeStringToISODateTime(cancellationResponse.effectiveTime._attributes.value)

  const fhirPatient = createPatient(cancellationResponse.recordTarget.Patient)

  const convertedResponsibleParty = convertAgentPerson(cancellationResponse.responsibleParty.AgentPerson)
  const fhirResponsiblePartyPractitioner = convertedResponsibleParty.fhirPractitioner
  const fhirResponsiblePartyOrganization = convertedResponsibleParty.fhirOrganization
  const fhirResponsiblePartyPractitionerRole = convertedResponsibleParty.fhirPractitionerRole

  const convertedAuthor = convertAgentPerson(cancellationResponse.author.AgentPerson)
  const fhirAuthorPractitioner = convertedAuthor.fhirPractitioner
  const fhirAuthorOrganization = convertedAuthor.fhirOrganization
  const fhirAuthorPractitionerRole = convertedAuthor.fhirPractitionerRole

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

  bundle.entry = [
    fhirMessageHeader,
    fhirMedicationRequest,
    fhirPatient,
    fhirAuthorPractitioner,
    fhirAuthorOrganization,
    fhirAuthorPractitionerRole,
    fhirResponsiblePartyPractitioner,
    fhirResponsiblePartyOrganization,
    fhirResponsiblePartyPractitionerRole
  ].map(convertResourceToBundleEntry)
  //TODO some error types need to have extra resources in bundle (e.g. dispenser info), add them
  return bundle
}

function convertAgentPerson(hl7AgentPerson: AgentPerson) {
  const fhirPractitioner = createPractitioner(hl7AgentPerson)

  //TODO: dont duplicate organization blocks
  const fhirOrganization = createOrganization(hl7AgentPerson.representedOrganization)

  const fhirPractitionerRole = createPractitionerRole(
    hl7AgentPerson,
    fhirPractitioner.id,
    fhirOrganization.id
  )
  return {fhirPractitioner, fhirOrganization, fhirPractitionerRole}
}

function convertResourceToBundleEntry(resource: fhir.Resource) {
  return {
    resource,
    fullUrl: `urn:uuid:${resource.id}`
  }
}

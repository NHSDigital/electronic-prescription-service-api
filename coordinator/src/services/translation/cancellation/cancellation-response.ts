import * as fhir from "../../../models/fhir/fhir-resources"
import {SpineCancellationResponse} from "../../../models/hl7-v3/hl7-v3-spine-response"
import * as uuid from "uuid"
import {createMedicationRequest} from "./cancellation-medication-conversion"
import {createPatient} from "./cancellation-patient"
import {createPractitioner} from "./cancellation-practitioner"
import {createOrganization} from "./cancellation-organization"
import {createPractitionerRole} from "./cancellation-practitioner-role"
import {createMessageHeader} from "./cancellation-message-header"
import {AgentPerson} from "../../../models/hl7-v3/hl7-v3-people-places"
import {convertHL7V3DateTimeStringToISODateTime} from "./common"

export function translateSpineCancelResponseIntoBundle(message: SpineCancellationResponse): fhir.Bundle {
  const actEvent = message["hl7:PORX_IN050101UK31"]["hl7:ControlActEvent"]
  const cancellationResponse = actEvent["hl7:subject"].CancellationResponse

  const bundle = new fhir.Bundle()

  bundle.type = "message"
  bundle.identifier = {
    system: "https://tools.ietf.org/html/rfc4122",
    value: cancellationResponse.id._attributes.root
  }
  bundle.timestamp = convertHL7V3DateTimeStringToISODateTime(cancellationResponse.effectiveTime._attributes.value)

  const fhirPatient = {
    fullUrl: generateFullUrl(uuid.v4().toLowerCase()),
    resource: createPatient(cancellationResponse.recordTarget.Patient)
  }

  const convertedResponsibleParty = convertAgentPerson(cancellationResponse.responsibleParty.AgentPerson)
  const fhirResponsiblePartyPractitioner = convertedResponsibleParty.fhirPractitioner
  const fhirResponsiblePartyOrganization = convertedResponsibleParty.fhirOrganization
  const fhirResponsiblePartyPractitionerRole = convertedResponsibleParty.fhirPractitionerRole

  const convertedAuthor = convertAgentPerson(cancellationResponse.author.AgentPerson)
  const fhirAuthorPractitioner = convertedAuthor.fhirPractitioner
  const fhirAuthorOrganization = convertedAuthor.fhirOrganization
  const fhirAuthorPractitionerRole = convertedAuthor.fhirPractitionerRole

  const fhirMedicationRequest = {
    fullUrl: generateFullUrl(uuid.v4().toLowerCase()),
    resource: createMedicationRequest(
      cancellationResponse, fhirResponsiblePartyPractitioner.fullUrl,
      fhirPatient.fullUrl, fhirAuthorPractitionerRole.fullUrl
    )
  }

  const authorRepresentedOrganization = cancellationResponse.author.AgentPerson.representedOrganization
  const representedOrganizationId = authorRepresentedOrganization.id._attributes.extension
  const messageId = message["hl7:PORX_IN050101UK31"]["hl7:id"]._attributes.root
  const cancelRequestId = cancellationResponse.pertinentInformation4.pertinentCancellationRequestRef.id._attributes.root
  const fhirMessageHeader = {
    fullUrl: generateFullUrl(uuid.v4().toLowerCase()),
    resource: createMessageHeader(
      messageId,
      fhirPatient.fullUrl,
      fhirMedicationRequest.fullUrl,
      representedOrganizationId,
      cancelRequestId
    )
  }

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
  ]
  //TODO some error types need to have extra resources in bundle (e.g. dispenser info), add them
  return bundle
}

function generateFullUrl(id: string) {
  return `urn:uuid:${id}`
}

function convertAgentPerson(hl7AgentPerson: AgentPerson) {
  const responsiblePartyCode = hl7AgentPerson.code._attributes.code
  const fhirPractitioner = {
    fullUrl: generateFullUrl(uuid.v4().toLowerCase()),
    resource: createPractitioner(hl7AgentPerson)
  }

  const fhirOrganization = {
    fullUrl: generateFullUrl(uuid.v4().toLowerCase()),
    resource: createOrganization(hl7AgentPerson.representedOrganization)
  }

  const fhirPractitionerRole = {
    fullUrl: generateFullUrl(uuid.v4().toLowerCase()),
    resource: createPractitionerRole(
      hl7AgentPerson,
      fhirPractitioner.fullUrl,
      responsiblePartyCode,
      fhirOrganization.fullUrl
    )
  }
  return {fhirPractitioner, fhirOrganization, fhirPractitionerRole}
}

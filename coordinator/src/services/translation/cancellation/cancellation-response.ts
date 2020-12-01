import * as fhir from "../../../models/fhir/fhir-resources"
import {SpineCancellationResponse} from "../../../models/hl7-v3/hl7-v3-spine-response"
import * as uuid from "uuid"
import {createMedicationRequest} from "./cancellation-medication-conversion"
import {createPatient} from "./cancellation-patient"
import {createPractitioner} from "./cancellation-practitioner"
import {createOrganization} from "./cancellation-organization"
import {createPractitionerRole} from "./cancellation-practitioner-role"
import {AgentPerson} from "../../../models/hl7-v3/hl7-v3-people-places"

export function translateSpineCancelResponseIntoBundle(message: SpineCancellationResponse): fhir.Bundle {
  const actEvent = message["hl7:PORX_IN050101UK31"]["hl7:ControlActEvent"]
  const cancellationResponse = actEvent["hl7:subject"].CancellationResponse

  const bundle = new fhir.Bundle()

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

  bundle.entry = [
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

  bundle.type = "message"
  return bundle
}

function generateFullUrl(id: string) {
  return `urn:uuid:${id}`
}

function convertAgentPerson(agentPerson: AgentPerson) {
  const responsiblePartyCode = agentPerson.code._attributes.code
  const fhirPractitioner = {
    fullUrl: generateFullUrl(uuid.v4().toLowerCase()),
    resource: createPractitioner(agentPerson)
  }

  const fhirOrganization = {
    fullUrl: generateFullUrl(uuid.v4().toLowerCase()),
    resource: createOrganization(agentPerson.representedOrganization)
  }

  const fhirPractitionerRole = {
    fullUrl: generateFullUrl(uuid.v4().toLowerCase()),
    resource: createPractitionerRole(
      agentPerson,
      fhirPractitioner.fullUrl,
      responsiblePartyCode,
      fhirOrganization.fullUrl
    )
  }
  return {fhirPractitioner, fhirOrganization, fhirPractitionerRole}
}

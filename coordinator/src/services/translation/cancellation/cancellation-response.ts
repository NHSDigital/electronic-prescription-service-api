import * as fhir from "../../../models/fhir/fhir-resources"
import {SpineCancellationResponse} from "../../../models/hl7-v3/hl7-v3-spine-response"
import * as uuid from "uuid"
import {createMedicationRequest} from "./cancellation-medication-conversion"
import {createPatient} from "./cancellation-patient"
import {createPractitioner} from "./cancellation-practitioner"
import {createOrganization} from "./cancellation-organization"
import {createPractitionerRole} from "./cancellation-practitioner-role"
import {AgentPerson} from "../../../models/hl7-v3/hl7-v3-people-places"

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
  const responsiblePartyOrganizationTelecom = fhirOrganization.resource.telecom

  const fhirPractitionerRole = {
    fullUrl: generateFullUrl(uuid.v4().toLowerCase()),
    resource: createPractitionerRole(
      fhirPractitioner.fullUrl,
      responsiblePartyCode,
      fhirOrganization.fullUrl,
      responsiblePartyOrganizationTelecom
    )
  }
  return {fhirPractitioner, fhirOrganization, fhirPractitionerRole}
}

export function translateSpineCancelResponseIntoBundle(message: SpineCancellationResponse): fhir.Bundle {
  const actEvent = message["hl7:PORX_IN050101UK31"]["hl7:ControlActEvent"]
  const cancellationResponse = actEvent["hl7:subject"].CancellationResponse

  const bundle = new fhir.Bundle()

  const fhirPatient = {
    fullUrl: generateFullUrl(uuid.v4().toLowerCase()),
    resource: createPatient(cancellationResponse.recordTarget.Patient)
  }
  const responsiblePartyStuff = convertAgentPerson(cancellationResponse.responsibleParty.AgentPerson)
  const fhirResponsiblePartyPractitioner = responsiblePartyStuff.fhirPractitioner
  const fhirResponsiblePartyOrganization = responsiblePartyStuff.fhirOrganization
  const fhirResponsiblePartyPractitionerRole = responsiblePartyStuff.fhirPractitionerRole

  const authorStuff = convertAgentPerson(cancellationResponse.responsibleParty.AgentPerson)
  const fhirAuthorPractitioner = authorStuff.fhirPractitioner
  const fhirAuthorOrganization = authorStuff.fhirOrganization
  const fhirAuthorPractitionerRole = authorStuff.fhirPractitionerRole

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

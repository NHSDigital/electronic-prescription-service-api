import * as fhir from "../../../models/fhir/fhir-resources"
import {SpineCancellationResponse} from "../../../models/hl7-v3/hl7-v3-spine-response"
import * as uuid from "uuid"
import {readXml} from "../../serialisation/xml"
import {createMedicationRequest} from "./cancellation-medication-conversion"
import {createPatient} from "./cancellation-patient"
import {createPractitioner} from "./cancellation-practitioner"
import {createOrganization} from "./cancellation-organization"
import {createPractitionerRole} from "./cancellation-practitioner-role"

export function translateSpineCancelResponseIntoBundle(message: string): fhir.Bundle {
  const parsedMsg = readXml(message) as SpineCancellationResponse

  const actEvent = parsedMsg["hl7:PORX_IN050101UK31"]["hl7:ControlActEvent"]
  const cancellationResponse = actEvent["hl7:subject"].CancellationResponse

  const bundle = new fhir.Bundle()

  const patientId = uuid.v4().toLowerCase()
  const fhirPatient = {
    fullUrl: generateFullUrl(patientId),
    resource: createPatient(cancellationResponse.recordTarget.Patient)
  }

  const responsiblePartyCode = cancellationResponse.responsibleParty.AgentPerson.code._attributes.code
  const responsiblePartyPractitionerId = uuid.v4().toLowerCase()
  const fhirResponsiblePartyPractitioner = {
    fullUrl: generateFullUrl(responsiblePartyPractitionerId),
    resource: createPractitioner(cancellationResponse.responsibleParty.AgentPerson)
  }
  const responsiblePartyOrganizationId = uuid.v4().toLowerCase()
  const fhirResponsiblePartyOrganization = {
    fullUrl: generateFullUrl(responsiblePartyOrganizationId),
    resource: createOrganization(cancellationResponse.responsibleParty.AgentPerson.representedOrganization)
  }
  const responsiblePartyOrganizationTelecom = fhirResponsiblePartyOrganization.resource.telecom
  const responsiblePartyPractitionerRoleId = uuid.v4().toLowerCase()
  const fhirResponsiblePartyPractitionerRole = {
    fullUrl: generateFullUrl(responsiblePartyPractitionerRoleId),
    resource: createPractitionerRole(
      cancellationResponse,
      fhirResponsiblePartyPractitioner.fullUrl,
      responsiblePartyCode,
      fhirResponsiblePartyOrganization.fullUrl,
      responsiblePartyOrganizationTelecom
    )
  }
  const authorCode = cancellationResponse.author.AgentPerson.code._attributes.code
  const authorPractitionerId = uuid.v4().toLowerCase()
  const fhirAuthorPractitioner = {
    fullUrl: generateFullUrl(authorPractitionerId),
    resource: createPractitioner(cancellationResponse.author.AgentPerson)
  }
  const authorOrganizationId = uuid.v4().toLowerCase()
  const fhirAuthorOrganization = {
    fullUrl: generateFullUrl(authorOrganizationId),
    resource: createOrganization(cancellationResponse.author.AgentPerson.representedOrganization)
  }
  const authorOrganizationTelecom = fhirResponsiblePartyOrganization.resource.telecom

  const authorPractitionerRoleId = uuid.v4().toLowerCase()
  const fhirAuthorPractitionerRole = {
    fullUrl: generateFullUrl(authorPractitionerRoleId),
    resource: createPractitionerRole(
      cancellationResponse,
      fhirAuthorPractitioner.fullUrl,
      authorCode,
      fhirAuthorOrganization.fullUrl,
      authorOrganizationTelecom
    )
  }

  const medicationRequestId = uuid.v4().toLowerCase()
  const fhirMedicationRequest = {
    fullUrl: generateFullUrl(medicationRequestId),
    resource: createMedicationRequest(
      cancellationResponse, fhirResponsiblePartyPractitioner.fullUrl,
      patientId, fhirAuthorPractitionerRole.fullUrl
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

import * as fhir from "../../../models/fhir/fhir-resources"
import {SpineCancellationResponse} from "../../../models/hl7-v3/hl7-v3-spine-response"
import * as uuid from "uuid"
import {readXml} from "../../serialisation/xml"
import {createMedicationRequest} from "./cancellation-medication-conversion"
import {createPatient} from "./cancellation-patient"
import {createPractitioner} from "./cancellation-practitioner"
import {createOrganization} from "./cancellation-organization"

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

  const responsiblePartyId = uuid.v4().toLowerCase()
  const fhirResponsibleParty = {
    fullUrl: generateFullUrl(responsiblePartyId),
    resource: createPractitioner(cancellationResponse.responsibleParty.AgentPerson)
  }
  const responsiblePartyOrganizationId = uuid.v4().toLowerCase()
  const fhirResponsiblePartyOrganization = {
    fullUrl: generateFullUrl(responsiblePartyOrganizationId),
    resource: createOrganization(cancellationResponse.responsibleParty.AgentPerson.representedOrganization)
  }

  const authorId = uuid.v4().toLowerCase()
  const fhirAuthor = {
    fullUrl: generateFullUrl(authorId),
    resource: createPractitioner(cancellationResponse.author.AgentPerson)
  }
  const authorOrganizationId = uuid.v4().toLowerCase()
  const fhirAuthorOrganization = {
    fullUrl: generateFullUrl(authorOrganizationId),
    resource: createOrganization(cancellationResponse.author.AgentPerson.representedOrganization)
  }

  //TODO these resources should reference the ones above in places, so we need to pass in references
  const medicationRequestId = uuid.v4().toLowerCase()
  const fhirMedicationRequest = {
    fullUrl: generateFullUrl(medicationRequestId),
    resource: createMedicationRequest(cancellationResponse)
  }
  //TODO PractitionerRoles for author and responsibleParty, MessageHeader

  bundle.entry = [
    fhirMedicationRequest,
    fhirPatient,
    fhirAuthor,
    fhirAuthorOrganization,
    fhirResponsibleParty,
    fhirResponsiblePartyOrganization
  ]
  //TODO some error types need to have extra resources in bundle (e.g. dispenser info), add them

  bundle.type = "message"
  return bundle
}

function generateFullUrl(id: string) {
  return `urn:uuid:${id}`
}

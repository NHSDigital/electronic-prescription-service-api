import * as fhir from "../../../models/fhir/fhir-resources"
import {readXml} from "../../serialisation/xml"
import {createMedicationRequest} from "./cancellation-medication-conversion"
import {SpineCancellationResponse} from "../../../models/hl7-v3/hl7-v3-spine-response"
import {createPatient} from "./cancellation-patient"
import {createPractitioner} from "./cancellation-practitioner"
import * as uuid from "uuid"

export function translateSpineCancelResponseIntoBundle(message: string): fhir.Bundle {
  const parsedMsg = readXml(message) as SpineCancellationResponse

  const actEvent = parsedMsg["hl7:PORX_IN050101UK31"]["hl7:ControlActEvent"]
  const cancellationResponse = actEvent["hl7:subject"].CancellationResponse

  const bundle = new fhir.Bundle()

  const fhirPatient = {
    fullUrl: uuid.v4().toLowerCase(),
    resource: createPatient(parsedMsg)
  }
  const fhirResponsibleParty = {
    fullUrl: uuid.v4().toLowerCase(),
    resource: createPractitioner(cancellationResponse.responsibleParty.AgentPerson)
  }
  const fhirAuthor = {
    fullUrl: uuid.v4().toLowerCase(),
    resource: createPractitioner(cancellationResponse.author.AgentPerson)
  }

  //TODO these resources should reference the ones above in places, so we need to pass in references
  const fhirMedicationRequest = {
    fullUrl: uuid.v4().toLowerCase(),
    resource: createMedicationRequest(parsedMsg)
  }

  bundle.entry = [
    fhirMedicationRequest,
    fhirPatient,
    fhirAuthor,
    fhirResponsibleParty
  ]

  bundle.type = "message"
  return bundle
}

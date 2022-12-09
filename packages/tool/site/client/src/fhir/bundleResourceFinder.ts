import * as fhir from "fhir/r4"
import {MedicationDispense, MedicationRequest} from "./helpers"

export const getPatientResources = buildResourceFinder<fhir.Patient>("Patient")
export const getPractitionerResources = buildResourceFinder<fhir.Practitioner>("Practitioner")
export const getPractitionerRoleResources = buildResourceFinder<fhir.PractitionerRole>("PractitionerRole")
export const getOrganizationResources = buildResourceFinder<fhir.Organization>("Organization")
export const getMedicationRequestResources = buildResourceFinder<MedicationRequest>("MedicationRequest")
export const getMedicationDispenseResources = buildResourceFinder<MedicationDispense>("MedicationDispense")
export const getMessageHeaderResources = buildResourceFinder<fhir.MessageHeader>("MessageHeader")
export const getCommunicationRequestResources = buildResourceFinder<fhir.CommunicationRequest>("CommunicationRequest")

function buildResourceFinder<T extends fhir.FhirResource>(resourceType: string): (payload: fhir.Bundle) => Array<T> {
  return function (bundle: fhir.Bundle): Array<T> {
    const typeCheck = (resource: fhir.FhirResource): resource is T => resource.resourceType === resourceType
    return bundle.entry.map(entry => entry.resource).filter(typeCheck)
  }
}

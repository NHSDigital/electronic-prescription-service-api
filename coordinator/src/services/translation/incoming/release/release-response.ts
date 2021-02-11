import {ParentPrescription} from "../../../../models/hl7-v3/hl7-v3-prescriptions"
import * as fhir from "../../../../models/fhir/fhir-resources"
import {isDeepStrictEqual} from "util"
import {convertResourceToBundleEntry, translateAndAddAgentPerson, translateAndAddPatient} from "../common"
import {toArray} from "../../common"
import {createMedicationRequest} from "./medication-request"

export function createBundleEntries(parentPrescription: ParentPrescription): Array<fhir.BundleEntry> {
  const unorderedBundleResources: Array<fhir.Resource> = []

  const hl7Patient = parentPrescription.recordTarget.Patient
  const patientId = translateAndAddPatient(hl7Patient, unorderedBundleResources)

  const pertinentPrescription = parentPrescription.pertinentInformation1.pertinentPrescription

  const hl7AuthorAgentPerson = pertinentPrescription.author.AgentPerson
  const authorId = translateAndAddAgentPerson(hl7AuthorAgentPerson, unorderedBundleResources)

  const hl7ResponsiblePartyAgentPerson = pertinentPrescription.responsibleParty?.AgentPerson
  let responsiblePartyId = authorId
  if (hl7ResponsiblePartyAgentPerson && !isDeepStrictEqual(hl7ResponsiblePartyAgentPerson, hl7AuthorAgentPerson)) {
    responsiblePartyId = translateAndAddAgentPerson(hl7ResponsiblePartyAgentPerson, unorderedBundleResources)
  }

  const hl7LineItems = toArray(pertinentPrescription.pertinentInformation2).map(pi2 => pi2.pertinentLineItem)
  hl7LineItems.forEach(hl7LineItem => {
    const medicationRequest = createMedicationRequest(hl7LineItem, patientId, authorId, responsiblePartyId)
    unorderedBundleResources.push(medicationRequest)
  })

  return unorderedBundleResources.map(convertResourceToBundleEntry)
}

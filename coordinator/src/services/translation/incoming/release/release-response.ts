import {ParentPrescription} from "../../../../models/hl7-v3/hl7-v3-prescriptions"
import * as fhir from "../../../../models/fhir/fhir-resources"
import {isDeepStrictEqual} from "util"
import {convertResourceToBundleEntry, translateAndAddAgentPerson, translateAndAddPatient} from "../common"
import {toArray} from "../../common"
import {createMedicationRequest} from "./medication-request"
import {createMessageHeader} from "../message-header"

export function createBundleEntries(parentPrescription: ParentPrescription): Array<fhir.BundleEntry> {
  const bundleResources: Array<fhir.Resource> = []
  const focusIds: Array<string> = []

  const hl7Patient = parentPrescription.recordTarget.Patient
  const patientId = translateAndAddPatient(hl7Patient, bundleResources)
  focusIds.push(patientId)

  const pertinentPrescription = parentPrescription.pertinentInformation1.pertinentPrescription
  const hl7AuthorAgentPerson = pertinentPrescription.author.AgentPerson
  const authorId = translateAndAddAgentPerson(hl7AuthorAgentPerson, bundleResources)

  const hl7ResponsiblePartyAgentPerson = pertinentPrescription.responsibleParty?.AgentPerson
  let responsiblePartyId = authorId
  if (hl7ResponsiblePartyAgentPerson && !isDeepStrictEqual(hl7ResponsiblePartyAgentPerson, hl7AuthorAgentPerson)) {
    responsiblePartyId = translateAndAddAgentPerson(hl7ResponsiblePartyAgentPerson, bundleResources)
  }

  const hl7LineItems = toArray(pertinentPrescription.pertinentInformation2).map(pi2 => pi2.pertinentLineItem)
  hl7LineItems.forEach(hl7LineItem => {
    const medicationRequest = createMedicationRequest(hl7LineItem, patientId, authorId, responsiblePartyId)
    bundleResources.push(medicationRequest)
    focusIds.push(medicationRequest.id)
  })

  const messageId = parentPrescription.id._attributes.root
  const representedOrganizationId = hl7AuthorAgentPerson.representedOrganization.id._attributes.extension
  const messageHeader = createMessageHeader(
    messageId,
    focusIds,
    representedOrganizationId,
    "otherMessageId" //TODO - do we have the original message id?
  )
  bundleResources.unshift(messageHeader)

  return bundleResources.map(convertResourceToBundleEntry)
}

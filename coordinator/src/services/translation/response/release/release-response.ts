import {isDeepStrictEqual} from "util"
import {convertResourceToBundleEntry, translateAndAddAgentPerson, translateAndAddPatient} from "../common"
import {toArray} from "../../common"
import {createMedicationRequest} from "./release-medication-request"
import {createMessageHeader} from "../message-header"
import {createAndAddCommunicationRequest, parseAdditionalInstructions} from "./additional-instructions"
import * as uuid from "uuid"
import {convertHL7V3DateTimeToIsoDateTimeString} from "../../common/dateTime"
import * as hl7V3 from "../../../../models/hl7-v3"
import {fhir} from "../../../../../../models/library"

const SUPPORTED_MESSAGE_TYPE = "PORX_MT122003UK32"

export function createOuterBundle(releaseResponse: hl7V3.PrescriptionReleaseResponse): fhir.Bundle {
  const releaseRequestId = releaseResponse.inFulfillmentOf.priorDownloadRequestRef.id._attributes.root
  const parentPrescriptions = toArray(releaseResponse.component)
    .filter(component => component.templateId._attributes.extension === SUPPORTED_MESSAGE_TYPE)
    .map(component => component.ParentPrescription)
  return {
    resourceType: "Bundle",
    id: uuid.v4(),
    meta: {
      lastUpdated: convertHL7V3DateTimeToIsoDateTimeString(releaseResponse.effectiveTime)
    },
    identifier: {
      system: "https://tools.ietf.org/html/rfc4122",
      value: releaseResponse.id._attributes.root.toLowerCase()
    },
    type: "searchset",
    total: parentPrescriptions.length,
    entry: parentPrescriptions
      .map(parentPrescription => createInnerBundle(parentPrescription, releaseRequestId))
      .map(convertResourceToBundleEntry)
  }
}

export function createInnerBundle(parentPrescription: hl7V3.ParentPrescription, releaseRequestId: string): fhir.Bundle {
  return {
    resourceType: "Bundle",
    id: uuid.v4(),
    meta: {
      lastUpdated: convertHL7V3DateTimeToIsoDateTimeString(parentPrescription.effectiveTime)
    },
    identifier: {
      system: "https://tools.ietf.org/html/rfc4122",
      value: parentPrescription.id._attributes.root.toLowerCase()
    },
    type: "message",
    entry: createBundleResources(parentPrescription, releaseRequestId).map(convertResourceToBundleEntry)
  }
}

export function createBundleResources(
  parentPrescription: hl7V3.ParentPrescription,
  releaseRequestId: string
): Array<fhir.Resource> {
  const bundleResources: Array<fhir.Resource> = []
  const focusIds: Array<string> = []

  const patientId = translateAndAddPatient(parentPrescription.recordTarget.Patient, bundleResources)
  focusIds.push(patientId)

  const pertinentPrescription = parentPrescription.pertinentInformation1.pertinentPrescription
  const authorAgentPerson = pertinentPrescription.author.AgentPerson
  const authorId = translateAndAddAgentPerson(authorAgentPerson, bundleResources)

  const responsiblePartyAgentPerson = pertinentPrescription.responsibleParty?.AgentPerson
  let responsiblePartyId = authorId
  if (responsiblePartyAgentPerson && !isDeepStrictEqual(responsiblePartyAgentPerson, authorAgentPerson)) {
    responsiblePartyId = translateAndAddAgentPerson(responsiblePartyAgentPerson, bundleResources)
  }

  const lineItems = toArray(pertinentPrescription.pertinentInformation2).map(pi2 => pi2.pertinentLineItem)

  const firstItemText = lineItems[0].pertinentInformation1?.pertinentAdditionalInstructions?.value?._text ?? ""
  const firstItemAdditionalInstructions = parseAdditionalInstructions(firstItemText)
  const medication = firstItemAdditionalInstructions.medication
  const patientInfo = firstItemAdditionalInstructions.patientInfo
  if (medication.length || patientInfo.length) {
    createAndAddCommunicationRequest(patientId, medication, patientInfo, bundleResources)
  }

  lineItems.forEach(hl7LineItem => {
    const medicationRequest = createMedicationRequest(
      pertinentPrescription,
      hl7LineItem,
      patientId,
      authorId,
      responsiblePartyId
    )
    bundleResources.push(medicationRequest)
    focusIds.push(medicationRequest.id)
  })

  const messageHeader = createMessageHeader(
    parentPrescription.id._attributes.root,
    fhir.EVENT_CODING_PRESCRIPTION_ORDER,
    focusIds,
    pertinentPrescription.performer?.AgentOrgSDS?.agentOrganizationSDS?.id?._attributes?.extension,
    releaseRequestId
  )
  bundleResources.unshift(messageHeader)

  return bundleResources
}

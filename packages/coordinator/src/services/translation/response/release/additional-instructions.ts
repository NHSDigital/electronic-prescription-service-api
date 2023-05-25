import * as uuid from "uuid"
import {fhir} from "@models"
import {readXmlStripNamespace} from "../../../serialisation/xml"

const MEDICATION_TAG_MATCHER = /^\s*<medication>(.*?)<\/medication>/
const PATIENT_INFO_TAG_MATCHER = /^\s*<patientInfo>(.*?)<\/patientInfo>/
const CONTROLLED_DRUG_PREFIX = "CD: "

export function parseAdditionalInstructions(additionalInstructionsText: string): {
  medication: Array<string>,
  patientInfo: Array<string>,
  controlledDrugWords: string,
  additionalInstructions: string
} {
  const medication: Array<string> = []
  const patientInfo: Array<string> = []

  let medicationMatch = MEDICATION_TAG_MATCHER.exec(additionalInstructionsText)
  let patientInfoMatch = PATIENT_INFO_TAG_MATCHER.exec(additionalInstructionsText)
  while (medicationMatch || patientInfoMatch) {
    if (medicationMatch) {
      const medicationJsFromXml = readXmlStripNamespace(medicationMatch[0])
      medication.push(medicationJsFromXml.medication._text)
      additionalInstructionsText = additionalInstructionsText.substring(medicationMatch[0].length)
    } else {
      const patientInfoJsFromXml = readXmlStripNamespace(patientInfoMatch[0])
      patientInfo.push(patientInfoJsFromXml.patientInfo._text)
      additionalInstructionsText = additionalInstructionsText.substring(patientInfoMatch[0].length)
    }
    medicationMatch = MEDICATION_TAG_MATCHER.exec(additionalInstructionsText)
    patientInfoMatch = PATIENT_INFO_TAG_MATCHER.exec(additionalInstructionsText)
  }

  const medicationAdditionalInstructions = parseMedicationAdditionalInstructions(additionalInstructionsText)

  return {
    medication,
    patientInfo,
    controlledDrugWords: medicationAdditionalInstructions.controlledDrugWords,
    additionalInstructions: medicationAdditionalInstructions.additionalInstructions
  }
}

function parseMedicationAdditionalInstructions(text: string): {
  controlledDrugWords: string,
  additionalInstructions: string
} {
  if (text.startsWith(CONTROLLED_DRUG_PREFIX)) {
    const separatorIndex = text.indexOf("\n")
    if (separatorIndex > -1) {
      return {
        controlledDrugWords: text.substring(CONTROLLED_DRUG_PREFIX.length, separatorIndex),
        additionalInstructions: text.substring(separatorIndex + 1)
      }
    }
    return {
      controlledDrugWords: text.substring(CONTROLLED_DRUG_PREFIX.length),
      additionalInstructions: ""
    }
  }
  return {
    controlledDrugWords: "",
    additionalInstructions: text
  }
}

export interface TranslatedAdditionalInstructions {
  communicationRequest: fhir.CommunicationRequest
  list?: fhir.List
}

export function translateAdditionalInstructions(
  patientId: string,
  patientIdentifier: fhir.Identifier,
  medication: Array<string>,
  patientInfo: Array<string>,
  organizationIdentifier: fhir.Identifier
): TranslatedAdditionalInstructions {
  const contentStringPayloads = patientInfo.map(patientInfoEntry => ({contentString: patientInfoEntry}))
  const communicationRequest = createCommunicationRequest(
    patientId, contentStringPayloads, patientIdentifier, organizationIdentifier
  )

  const translatedAdditionalInstructions: TranslatedAdditionalInstructions = {
    communicationRequest
  }

  if (medication.length) {
    const list = createList(medication)
    translatedAdditionalInstructions.list = list

    const listId = list.id
    communicationRequest.payload.push({contentReference: fhir.createReference(listId)})
  }
  return translatedAdditionalInstructions
}

export function createCommunicationRequest(
  patientId: string,
  payload: Array<fhir.ContentReferencePayload | fhir.ContentStringPayload>,
  patientIdentifier: fhir.Identifier,
  organizationIdentifier: fhir.Identifier
): fhir.CommunicationRequest {
  return {
    resourceType: "CommunicationRequest",
    id: uuid.v4(),
    status: "unknown",
    subject: fhir.createReference(patientId),
    payload: payload,
    requester: fhir.createIdentifierReference(organizationIdentifier),
    recipient: [fhir.createIdentifierReference(patientIdentifier)]
  }
}

export function createList(listItems: Array<string>): fhir.List {
  return {
    resourceType: "List",
    id: uuid.v4(),
    status: "current",
    mode: "snapshot",
    entry: listItems.map(listItem => ({item: {display: listItem}}))
  }
}

export function addTranslatedAdditionalInstructions(
  bundleResources: Array<fhir.Resource>,
  translatedAdditionalInstructions: TranslatedAdditionalInstructions
): void {
  bundleResources.push(translatedAdditionalInstructions.communicationRequest)
  if (translatedAdditionalInstructions.list) {
    bundleResources.push(translatedAdditionalInstructions.list)
  }
}

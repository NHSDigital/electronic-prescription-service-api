import * as uuid from "uuid"
import {fhir} from "@models"
import {readXmlStripNamespace} from "../../../serialisation/xml"
import pino from "pino"

const MEDICATION_TAG_MATCHER = /^\s*<medication>([\s\S]*?)<\/medication>/
const PATIENT_INFO_TAG_MATCHER = /^\s*<patientInfo>([\s\S]*?)<\/patientInfo>/
const CONTROLLED_DRUG_MATCHER = /^\s*CD: (.*?)(?:$|\n)/

export function parseAdditionalInstructions(additionalInstructionsText: string, logger: pino.Logger<never>): {
  medication: Array<string>
  patientInfo: Array<string>
  controlledDrugWords: string
  additionalInstructions: string
} {
  const medication: Array<string> = []
  const patientInfo: Array<string> = []

  let medicationMatch = MEDICATION_TAG_MATCHER.exec(additionalInstructionsText)
  let patientInfoMatch = PATIENT_INFO_TAG_MATCHER.exec(additionalInstructionsText)
  while (medicationMatch || patientInfoMatch) {
    if (medicationMatch) {
      try {
        const medicationJsFromXml = readXmlStripNamespace(medicationMatch[0])
        medication.push(medicationJsFromXml.medication._text)
      } catch (err) {
        logger.warn({err}, "Failed to parse medication in additional instructions falling back to raw")
        medication.push(medicationMatch[1])
      }
      additionalInstructionsText = additionalInstructionsText.substring(medicationMatch[0].length)
    } else {
      try {
        const patientInfoJsFromXml = readXmlStripNamespace(patientInfoMatch[0])
        patientInfo.push(patientInfoJsFromXml.patientInfo._text)
      } catch (err) {
        logger.warn({err}, "Failed to parse patient info in additional instructions falling back to raw")
        patientInfo.push(patientInfoMatch[1])
      }
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
  controlledDrugWords: string
  additionalInstructions: string
} {
  const controlledDrugMatch = CONTROLLED_DRUG_MATCHER.exec(text)
  if (controlledDrugMatch) {
    return {
      controlledDrugWords: controlledDrugMatch[1],
      additionalInstructions: text.substring(controlledDrugMatch[0].length)
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
  const contentStringPayloads = patientInfo.map((patientInfoEntry) => ({contentString: patientInfoEntry}))
  const communicationRequest = createCommunicationRequest(
    patientId,
    contentStringPayloads,
    patientIdentifier,
    organizationIdentifier
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
    entry: listItems.map((listItem) => ({item: {display: listItem}}))
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

import * as fhir from "../../../../models/fhir/fhir-resources"
import * as uuid from "uuid"
import {createReference} from "../fhir-base-types"

const MEDICATION_TAG_MATCHER = /^<medication>(.*?)<\/medication>/
const PATIENT_INFO_TAG_MATCHER = /^<patientInfo>(.*?)<\/patientInfo>/
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
      medication.push(medicationMatch[1])
      additionalInstructionsText = additionalInstructionsText.substring(medicationMatch[0].length)
    }
    if (patientInfoMatch) {
      patientInfo.push(patientInfoMatch[1])
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

export function createAndAddCommunicationRequest(
  patientId: string,
  medication: Array<string>,
  patientInfo: Array<string>,
  bundleResources: Array<fhir.Resource>
): string {
  const payload: Array<fhir.ContentReferencePayload | fhir.ContentStringPayload> = []
  if (medication.length) {
    const listId = createAndAddList(medication, bundleResources)
    payload.push({contentReference: createReference(listId)})
  }
  patientInfo.forEach(patientInfoEntry => payload.push({contentString: patientInfoEntry}))
  const communicationRequest: fhir.CommunicationRequest = {
    resourceType: "CommunicationRequest",
    id: uuid.v4(),
    subject: createReference(patientId),
    payload: payload
  }
  bundleResources.push(communicationRequest)
  return communicationRequest.id
}

export function createAndAddList(listItems: Array<string>, bundleResources: Array<fhir.Resource>): string {
  const medicationList: fhir.List = {
    resourceType: "List",
    id: uuid.v4(),
    entry: listItems.map(listItem => ({item: {display: listItem}}))
  }
  bundleResources.push(medicationList)
  return medicationList.id
}

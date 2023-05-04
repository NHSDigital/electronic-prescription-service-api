import {namespacedCopyOf, writeXmlStringCanonicalized} from "../../serialisation/xml"
import {hl7V3, signature} from "@models"
import {toArray} from "../common"

export function extractFragments(parentPrescription: hl7V3.ParentPrescription): signature.Fragments {
  const pertinentPrescription = parentPrescription.pertinentInformation1.pertinentPrescription

  return {
    id: namespacedCopyOf(pertinentPrescription.id[0]),
    time: namespacedCopyOf(pertinentPrescription.author.time),
    agentPerson: namespacedCopyOf(pertinentPrescription.author.AgentPerson),
    recordTarget: namespacedCopyOf(parentPrescription.recordTarget),
    pertinentLineItem: toArray(pertinentPrescription.pertinentInformation2).map(getLineItemFragment)
  }
}

function getLineItemFragment(prescriptionPertinentInformation2: hl7V3.PrescriptionPertinentInformation2) {
  const lineItem = prescriptionPertinentInformation2.pertinentLineItem
  const lineItemWithoutRepeatNumberLow = getLineItemWithoutRepeatNumberLow(lineItem)
  const lineItemWithoutStatus = getLineItemWithoutStatus(lineItemWithoutRepeatNumberLow)
  return namespacedCopyOf(lineItemWithoutStatus)
}

function getLineItemWithoutRepeatNumberLow(lineItem: hl7V3.LineItem) {
  if (lineItem.repeatNumber) {
    return {
      ...lineItem,
      repeatNumber: {
        high: lineItem.repeatNumber.high
      }
    }
  } else {
    return lineItem
  }
}

function getLineItemWithoutStatus(lineItem: hl7V3.LineItem) {
  const {pertinentInformation4, ...remainingLineItem} = lineItem
  if (pertinentInformation4) {
    return {...remainingLineItem}
  } else {
    return lineItem
  }
}

export async function convertFragmentsToHashableFormat(
  fragments: signature.Fragments,
  canonicalizationMethod: string
) : Promise<string> {
  const fragmentsToBeHashed = []

  fragmentsToBeHashed.push({
    time: fragments.time,
    id: fragments.id
  })

  fragmentsToBeHashed.push({
    AgentPerson: fragments.agentPerson
  })

  fragmentsToBeHashed.push({
    recordTarget: fragments.recordTarget
  })

  fragments.pertinentLineItem.forEach(
    lineItem => fragmentsToBeHashed.push({
      pertinentLineItem: lineItem
    })
  )

  return await writeXmlStringCanonicalized({
    FragmentsToBeHashed: {
      Fragment: fragmentsToBeHashed
    }
  }, canonicalizationMethod)
}

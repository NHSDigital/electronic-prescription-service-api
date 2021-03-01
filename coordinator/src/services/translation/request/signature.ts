import * as XmlJs from "xml-js"
import {namespacedCopyOf, writeXmlStringCanonicalized} from "../../serialisation/xml"
import {Fragments} from "../../../models/signature"
import {toArray} from "../common"
import * as hl7V3 from "../../../models/hl7-v3"

export function extractFragments(parentPrescription: hl7V3.ParentPrescription): Fragments {
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
  return namespacedCopyOf(lineItemWithoutRepeatNumberLow)
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

export function convertFragmentsToHashableFormat(fragments: Fragments) : string {
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

  return writeXmlStringCanonicalized({
    FragmentsToBeHashed: {
      Fragment: fragmentsToBeHashed
    }
  } as XmlJs.ElementCompact)
}

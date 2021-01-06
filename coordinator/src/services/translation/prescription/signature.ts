import * as XmlJs from "xml-js"
import * as prescriptions from "../../../models/hl7-v3/hl7-v3-prescriptions"
import {namespacedCopyOf, writeXmlStringCanonicalized} from "../../serialisation/xml"
import {Fragments} from "../../../models/signature"

export function extractFragments(parentPrescription: prescriptions.ParentPrescription): Fragments {
  const pertinentPrescription = parentPrescription.pertinentInformation1.pertinentPrescription

  return {
    id: namespacedCopyOf(pertinentPrescription.id[0]),
    time: namespacedCopyOf(pertinentPrescription.author.time),
    agentPerson: namespacedCopyOf(pertinentPrescription.author.AgentPerson),
    recordTarget: namespacedCopyOf(parentPrescription.recordTarget),
    pertinentLineItem: pertinentPrescription.pertinentInformation2.map(getLineItemFragment)
  }
}

function getLineItemFragment(prescriptionPertinentInformation2: prescriptions.PrescriptionPertinentInformation2) {
  const lineItem = prescriptionPertinentInformation2.pertinentLineItem
  const lineItemWithoutRepeatNumberLow = getLineItemWithoutRepeatNumberLow(lineItem)
  return namespacedCopyOf(lineItemWithoutRepeatNumberLow)
}

function getLineItemWithoutRepeatNumberLow(lineItem: prescriptions.LineItem) {
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

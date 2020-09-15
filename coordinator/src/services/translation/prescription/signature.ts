import * as XmlJs from "xml-js"
import * as core from "../../../models/hl7-v3/hl7-v3-datatypes-core"
import * as codes from "../../../models/hl7-v3/hl7-v3-datatypes-codes"
import * as prescriptions from "../../../models/hl7-v3/hl7-v3-prescriptions"
import {namespacedCopyOf, writeXmlStringCanonicalized} from "../../serialisation/xml"
import {Display, DisplayMedication, Fragments} from "../../../models/signature"

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

export function convertFragmentsToDisplayableFormat(fragments: Fragments): Display {
  const prescriptionStartDate = fragments.time._attributes.value

  const patient = fragments.recordTarget.Patient
  const patientPerson = patient.patientPerson

  const patientName =
    joinCoreText(" ",
      patientPerson.name[0].prefix,
      patientPerson.name[0].given,
      patientPerson.name[0].family
    )
  const patientDob = patientPerson.birthTime._attributes.value
  const patientGender = getGenderFromCode(patientPerson.administrativeGenderCode)
  const patientNhsNumber =  patient.id._attributes.extension
  const patientAddress = joinCoreText(", ",
    patient.addr[0].streetAddressLine,
    patient.addr[0].postalCode
  )

  const prescriber = fragments.agentPerson
  const prescriberPerson = prescriber.agentPerson
  const prescribingOrg = prescriber.representedOrganization

  const prescriberName = joinCoreText(" ",
    prescriberPerson.name.prefix,
    prescriberPerson.name.given,
    prescriberPerson.name.family
  )
  const prescriberCode = prescriber.id._attributes.extension
  const prescriberOrg = `${prescribingOrg.name._text} (${prescribingOrg.id._attributes.extension})`
  const prescriberAddress = joinCoreText(", ",
    prescribingOrg.addr.streetAddressLine,
    prescribingOrg.addr.postalCode
  )

  const medication = fragments.pertinentLineItem
    .map((medication) => {
      return new DisplayMedication({
        name: medication.product.manufacturedProduct.manufacturedRequestedMaterial.code._attributes.displayName,
        quantity: medication.component.lineItemQuantity.quantity._attributes.value,
        dose: medication.pertinentInformation2.pertinentDosageInstructions.value
      })
    })

  return {
    prescriptionStartDate: prescriptionStartDate,
    patientName: patientName,
    patientDob: patientDob,
    patientGender: patientGender,
    patientNhsNumber: patientNhsNumber,
    patientAddress: patientAddress,
    prescriberName: prescriberName,
    prescriberCode: prescriberCode,
    prescriberOrg: prescriberOrg,
    prescriberAddress: prescriberAddress,
    medication: medication
  }
}

function joinCoreText(separator: string, ...values: Array<core.Text | Array<core.Text>>) : string {
  return values.map(unpackCoreText).filter(Boolean).join(separator)
}

function unpackCoreText(value: core.Text | Array<core.Text>) : string {
  if (isCoreTextArray(value)) {
    return value.map(v => v._text).join(" ")
  } else {
    const text = value as core.Text
    return text ? text._text : ""
  }
}

function isCoreTextArray(value: core.Text | Array<core.Text>) : value is Array<core.Text> {
  const valueArray = value as Array<core.Text>
  return valueArray !== undefined && valueArray.length > 0
}

function getGenderFromCode(code: codes.SexCode): string {
  switch (code) {
  case codes.SexCode.MALE:
    return "Male"
  case codes.SexCode.FEMALE:
    return "Female"
  case codes.SexCode.UNKNOWN:
    return "Unknown"
  case codes.SexCode.INDETERMINATE:
    return "Other"
  default:
    return "Unknown"
  }
}

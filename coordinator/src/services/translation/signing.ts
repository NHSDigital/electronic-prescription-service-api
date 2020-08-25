import * as XmlJs from "xml-js"
import * as core from "../../model/hl7-v3-datatypes-core"
import * as codes from "../../model/hl7-v3-datatypes-codes"
import * as prescriptions from "../../model/hl7-v3-prescriptions"
import {namespacedCopyOf, writeXmlStringCanonicalized} from "./xml"
import {Display, DisplayMedication, Fragments} from "../../model/signing"

export function extractFragments(parentPrescription: prescriptions.ParentPrescription): Fragments {
  const pertinentPrescription = parentPrescription.pertinentInformation1.pertinentPrescription

  const fragments: Fragments = {
    id: namespacedCopyOf(pertinentPrescription.id[0]),
    time: namespacedCopyOf(pertinentPrescription.author.time),
    agentPerson: namespacedCopyOf(pertinentPrescription.author.AgentPerson),
    recordTarget: namespacedCopyOf(parentPrescription.recordTarget),
    pertinentLineItem: pertinentPrescription.pertinentInformation2.map(
      pertinentInformation2 => namespacedCopyOf(pertinentInformation2.pertinentLineItem)
    )
  }

  return fragments
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

  const display: Display = {
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

  return display
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
function joinCoreText(seperator: string, ...values: any[]) : string {
  return values.map(unpackCoreText).filter(Boolean).join(seperator)
}

function unpackCoreText(value: core.Text | core.Text[]) : string {
  if (isCoreTextArray(value)) {
    return value.map(v => v._text).join(" ")
  } else {
    const text = value as core.Text
    return text !== undefined ? text._text : ""
  }
}

function isCoreTextArray(value: core.Text | core.Text[]) : value is core.Text[] {
  const valueArray = value as core.Text[]
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

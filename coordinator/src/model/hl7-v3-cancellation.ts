import * as core from "./hl7-v3-datatypes-core"
import * as codes from "./hl7-v3-datatypes-codes"
import {ElementCompact} from "xml-js"
import * as prescription from "./hl7-v3-prescriptions"

export class CancellationPrescriptionRoot {
  CancellationRequest: CancellationPrescription

  constructor(cancellationPrescription: CancellationPrescription) {
    this.CancellationRequest = cancellationPrescription
  }

}

export class CancellationPrescription implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "INFO",
    moodCode: "EVN"
  }

  id: codes.GlobalIdentifier
  code: codes.SnomedCode
  effectiveTime: core.Timestamp
  typeId: codes.TypeIdentifier
  recordTarget: prescription.RecordTarget
  author: prescription.Author
  responsibleParty: prescription.ResponsibleParty
  pertinentInformation1: PertinentInformation1
  pertinentInformation2: PertinentInformation2
  pertinentInformation: PertinentInformation
  pertinentInformation3: PertinentInformation3

  constructor(id: codes.GlobalIdentifier) {
    this.id = id
    this.code = new codes.SnomedCode("163501000000109", "Prescription - FocusActOrEvent (record artifact)")
    this.typeId = new codes.TypeIdentifier("PORX_MT135001UK32")
  }
}

export class PertinentInformation2 {
  _attributes: {
    typeCode: string
    contextConductionInd: string
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(false)

  pertinentPrescriptionID: PertinentPrescriptionID

  constructor(shortFormPrescriptionID: string){
    this._attributes= {
      typeCode: "PERT",
      contextConductionInd: "true"
    }
    this.pertinentPrescriptionID = new PertinentPrescriptionID(shortFormPrescriptionID)
  }
}

class PertinentPrescriptionID {
  _attributes: {
    classCode: string
    moodCode: string
  }

  code: codes.PrescriptionAnnotationCode

  value: codes.ShortFormPrescriptionIdentifier

  constructor(shortFormID: string){
    this._attributes = {
      classCode: "OBS",
      moodCode: "EVN"
    }
    this.code = new codes.PrescriptionAnnotationCode("PID")
    this.value = new codes.ShortFormPrescriptionIdentifier(shortFormID)
  }
}

export class PertinentInformation1{
  _attributes: {
    typeCode: string
    inversionInd: string
    negationInd: string
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(true)

  pertinentLineItemRef: PertinentLineItemRef

  constructor(lineItemRef: string) {
    this._attributes = {
      typeCode: "PERT",
      inversionInd: "false",
      negationInd: "false"
    }
    this.pertinentLineItemRef = new PertinentLineItemRef(lineItemRef)
  }
}

class PertinentLineItemRef {
  _attributes: {
    classCode: string
    moodCode: string
  }
  id: codes.GlobalIdentifier
  constructor(lineItemRef: string) {
    this._attributes = {
      classCode: "SBADM",
      moodCode: "RQO"
    }
    this.id = new codes.GlobalIdentifier(lineItemRef)
  }
}

export class PertinentInformation {
  _attributes: {
    typeCode: string
    contextConductionInd: string
  }
  seperatableInd: core.BooleanValue = new core.BooleanValue(false)
  pertinentCancellationReason: PertinentCancellationReason
  constructor(cancellationCode: string, cancellationDisplay: string) {
    this._attributes = {
      typeCode: "PERT",
      contextConductionInd: "true"
    }
    this.pertinentCancellationReason = new PertinentCancellationReason(cancellationCode, cancellationDisplay)
  }
}

class PertinentCancellationReason {
  _attributes: {
    classCode: string
    moodCode: string
  }
  code: codes.PrescriptionAnnotationCode
  text: {
    _text: string
  }
  value: codes.CancellationCode
  constructor(cancellationCode: string, cancellationDisplay: string){
    this._attributes = {
      classCode: "OBS",
      moodCode: "EVN"
    }
    this.code = new codes.PrescriptionAnnotationCode("CR")
    this.text = {_text: cancellationDisplay}
    this.value = new codes.CancellationCode(cancellationCode)
  }
}

export class PertinentInformation3 {
  _attributes: {
    typeCode: string
    contextConductionInd: string
  }
  seperatableInd: core.BooleanValue = new core.BooleanValue(true)
  pertinentOriginalPrescriptionRef: PertinentOriginalPrescriptionRef
  constructor(lineItemRef: string) {
    this._attributes = {
      typeCode: "PERT",
      contextConductionInd: "false"
    }
    this.pertinentOriginalPrescriptionRef = new PertinentOriginalPrescriptionRef(lineItemRef)
  }
}

class PertinentOriginalPrescriptionRef {
  _attributes: {
    classCode: string
    moodCode: string
  }
  id: codes.GlobalIdentifier
  constructor(lineItemRef: string) {
    this._attributes = {
      classCode: "SBADM",
      moodCode: "RQO"
    }
    this.id = new codes.GlobalIdentifier(lineItemRef)
  }
}

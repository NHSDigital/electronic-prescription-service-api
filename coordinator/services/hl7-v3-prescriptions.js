const core = require('./hl7-v3-datatypes-core')
const Bool = core.Bool
const Null = core.Null

const codes = require('./hl7-v3-datatypes-codes')
const Code = codes.Code
const Identifier = codes.Identifier

function Author() {
  this._attributes = {
    typeCode: "AUT",
    contextControlCode: "OP"
  }
}

function LineItem() {
  this._attributes = {
    classCode: "SBADM",
    moodCode: "RQO"
  }
  //TODO do we need to support child codes of this?
  this.code = new Code.SnomedCode("225426007", "administration of therapeutic substance (procedure)")
  this.effectiveTime = Null.NOT_APPLICABLE
}

LineItem.prototype.setProductCode = function (snomedCode) {
  this.product = {
    _attributes: {
      typeCode: "PRD",
      contextControlCode: "OP"
    },
    manufacturedProduct: {
      _attributes: {
        classCode: "MANU"
      },
      manufacturedRequestedMaterial: {
        _attributes: {
          classCode: "MMAT",
          determinerCode: "KIND"
        },
        code: snomedCode
      }
    }
  }
}

LineItem.prototype.setLineItemQuantity = function (lineItemQuantity) {
  this.component = {
    _attributes: {
      typeCode: "COMP"
    },
    seperatableInd: Bool.FALSE,
    lineItemQuantity: lineItemQuantity
  }
}

LineItem.prototype.setDosageInstructions = function (dosageInstructions) {
  this.pertinentInformation2 = {
    _attributes: {
      typeCode: "PERT",
      contextConductionInd: "true"
    },
    seperatableInd: Bool.FALSE,
    pertinentDosageInstructions: dosageInstructions
  }
}

function LineItemQuantity() {
  this._attributes = {
    classCode: "SPLY",
    moodCode: "RQO"
  }
  //TODO do we need to support child codes of this?
  this.code = new Code.SnomedCode("373784005", "dispensing medication")
}

function ParentPrescription() {
  this._attributes = {
    xmlns: "urn:hl7-org:v3",
    "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
    classCode: "INFO",
    moodCode: "EVN",
    "xsi:schemaLocation": "urn:hl7-org:v3 ..\\Schemas\\PORX_MT132004UK31.xsd"
  }
  this.code = new Code.SnomedCode("163501000000109", "Prescription")
  this.typeId = new Identifier.TypeIdentifier("PORX_MT132004UK31")
}

ParentPrescription.prototype.setRecordTarget = function (patient) {
  this.recordTarget = {
    _attributes: {typeCode: "RCT"},
    Patient: patient
  }
}

ParentPrescription.prototype.setPrescription = function (prescription) {
  this.pertinentInformation1 = {
    _attributes: {
      typeCode: "PERT",
      contextConductionInd: "true"
    },
    templateId: new Identifier.TemplateIdentifier("CSAB_RM-NPfITUK10.pertinentInformation"),
    pertinentPrescription: prescription
  }
}

function Prescription() {
  this._attributes = {
    classCode: "SBADM",
    moodCode: "RQO"
  }
  //TODO do we need to support child codes of this?
  this.code = new Code.SnomedCode("225426007", "administration of therapeutic substance (procedure)")
  this.effectiveTime = Null.NOT_APPLICABLE
  this.pertinentInformation2 = []
}

Prescription.prototype.setPrescriptionTreatmentType = function (prescriptionTreatmentType) {
  this.pertinentInformation5 = {
    _attributes: {
      typeCode: "PERT",
      contextConductionInd: "true"
    },
    seperatableInd: Bool.TRUE,
    pertinentPrescriptionTreatmentType: prescriptionTreatmentType
  }
}

Prescription.prototype.setDispensingSitePreference = function (dispensingSitePreference) {
  this.pertinentInformation1 = {
    _attributes: {
      typeCode: "PERT",
      contextConductionInd: "true"
    },
    seperatableInd: Bool.TRUE,
    pertinentDispensingSitePreference: dispensingSitePreference
  }
}

Prescription.prototype.setTokenIssued = function (tokenIssued) {
  this.pertinentInformation8 = {
    _attributes: {
      typeCode: "PERT",
      contextConductionInd: "true"
    },
    seperatableInd: Bool.TRUE,
    pertinentTokenIssued: tokenIssued
  }
}

Prescription.prototype.setPrescriptionType = function (prescriptionType) {
  this.pertinentInformation4 = {
    _attributes: {
      typeCode: "PERT",
      contextConductionInd: "true"
    },
    seperatableInd: Bool.TRUE,
    pertinentPrescriptionType: prescriptionType
  }
}

Prescription.prototype.addLineItem = function (lineItem) {
  this.pertinentInformation2.push(
    {
      _attributes: {
        typeCode: "PERT",
        inversionInd: "false",
        contextConductionInd: "true",
        negationInd: "false"
      },
      seperatableInd: Bool.TRUE,
      templateId: new Identifier.TemplateIdentifier("CSAB_RM-NPfITUK10.sourceOf2"),
      pertinentLineItem: lineItem
    }
  )
}

function PrescriptionAnnotation(code) {
  this._attributes = {
    classCode: "OBS",
    moodCode: "EVN"
  }
  this.code = new Code.PrescriptionAnnotationCode(code)
}

PrescriptionAnnotation.PrescriptionTreatmentType = function () {
  return new PrescriptionAnnotation("PTT")
}
PrescriptionAnnotation.DispensingSitePreference = function () {
  return new PrescriptionAnnotation("DSP")
}
PrescriptionAnnotation.TokenIssued = function () {
  return new PrescriptionAnnotation("TI")
}
PrescriptionAnnotation.PrescriptionType = function () {
  return new PrescriptionAnnotation("PT")
}
PrescriptionAnnotation.DosageInstructions = function () {
  return new PrescriptionAnnotation("DI")
}

function ResponsibleParty() {
  this._attributes = {
    typeCode: "RESP",
    contextControlCode: "OP"
  }
}

module.exports = {
  Author: Author,
  LineItem: LineItem,
  LineItemQuantity: LineItemQuantity,
  ParentPrescription: ParentPrescription,
  Prescription: Prescription,
  PrescriptionAnnotation: PrescriptionAnnotation,
  ResponsibleParty: ResponsibleParty
}

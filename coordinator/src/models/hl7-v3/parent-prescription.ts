import * as core from "./core"
import * as codes from "./codes"
import {ElementCompact} from "xml-js"
import * as prescription from "./prescription"
import * as patient from "./patient"

export class ParentPrescriptionRoot {
  ParentPrescription: ParentPrescription

  constructor(parentPrescription: ParentPrescription) {
    this.ParentPrescription = parentPrescription
  }
}

/**
 * This is the parent prescription.
 *
 * Each item on a prescription has an administration part and a supply part.
 * In each case some of the information is common to each item while other information is different.
 * This act represents the common parts of the administration part of each item on a prescription.
 */
export class ParentPrescription implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "INFO",
    moodCode: "EVN"
  }

  id: codes.GlobalIdentifier
  code: codes.SnomedCode
  effectiveTime: core.Timestamp
  typeId: codes.TypeIdentifier
  recordTarget: patient.RecordTarget
  pertinentInformation1: ParentPrescriptionPertinentInformation1
  pertinentInformation2: ParentPrescriptionPertinentInformation2

  constructor(id: codes.GlobalIdentifier) {
    this.id = id
    this.code = new codes.SnomedCode("163501000000109", "Prescription - FocusActOrEvent (record artifact)")
    this.effectiveTime = new core.Timestamp("PLACEHOLDER")
    this.typeId = new codes.TypeIdentifier("PORX_MT132004UK31")
  }
}

/**
 * A link between the ParentPrescription details of the message and the Prescription administration information.
 */
export class ParentPrescriptionPertinentInformation1 implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
    typeCode: "PERT",
    contextConductionInd: "true"
  }

  templateId: codes.TemplateIdentifier = new codes.TemplateIdentifier("CSAB_RM-NPfITUK10.pertinentInformation")
  pertinentPrescription: prescription.Prescription

  constructor(pertinentPrescription: prescription.Prescription) {
    this.pertinentPrescription = pertinentPrescription
  }
}

/**
 * An identifier of the Act Relationship that relates clinical statements directly to the focal act.
 */
export class ParentPrescriptionPertinentInformation2 implements ElementCompact {
  _attributes: core.AttributeTypeCode = {
    typeCode: "PERT"
  }

  templateId: codes.TemplateIdentifier = new codes.TemplateIdentifier("CSAB_RM-NPfITUK10.pertinentInformation1")
  pertinentCareRecordElementCategory: CareRecordElementCategory

  constructor(pertinentCareRecordElementCategory: CareRecordElementCategory) {
    this.pertinentCareRecordElementCategory = pertinentCareRecordElementCategory
  }
}

/**
 * An act used to categorise clinical statements within the message into care record element categories.
 * The CareRecordElementCategory act can reference multiple ActRef acts to 'group' multiple clinical statements under a
 * single category.
 */
export class CareRecordElementCategory implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "CATEGORY",
    moodCode: "EVN"
  }

  code = new codes.SnomedCode("185361000000102", "Medication - care record element (record artifact)")
  component: Array<CareRecordElementCategoryComponent>
}

/**
 * An act relationship used to convey that the ActRef act forms a component of the acts within the
 * CareRecordElementCategory.
 */
export class CareRecordElementCategoryComponent implements ElementCompact {
  _attributes: core.AttributeTypeCode = {
    typeCode: "COMP"
  }

  actRef: ActRef

  constructor(actRef: ActRef) {
    this.actRef = actRef
  }
}

export interface Act {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode
  id: codes.GlobalIdentifier
}

/**
 * Reference to a clinical statement within this message.
 */
export class ActRef implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode
  id: codes.GlobalIdentifier

  constructor(act: Act) {
    this._attributes = {
      classCode: act._attributes.classCode,
      moodCode: act._attributes.moodCode
    }

    this.id = act.id
  }
}

import {ElementCompact} from "xml-js"
import * as core from "./core"
import * as codes from "./codes"
import * as lineItem from "./line-item"
import * as agentPerson from "./agent-person"
import * as organization from "./organization"

/**
 * This act represents the distinct parts of the administration part for a single item on a Prescription.
 */
export class Prescription implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "SBADM",
    moodCode: "RQO"
  }

  id: [codes.GlobalIdentifier, codes.ShortFormPrescriptionIdentifier]
  code: codes.SnomedCode
  effectiveTime: core.Null
  repeatNumber?: core.Interval<core.NumericValue>
  performer?: Performer
  author: Author
  //TODO - legalAuthenticator
  responsibleParty: ResponsibleParty
  component1?: Component1
  pertinentInformation7?: PrescriptionPertinentInformation7
  pertinentInformation5: PrescriptionPertinentInformation5
  //TODO - pertinentInformation6
  pertinentInformation1: PrescriptionPertinentInformation1
  pertinentInformation2: PrescriptionPertinentInformation2 | Array<PrescriptionPertinentInformation2>
  pertinentInformation8: PrescriptionPertinentInformation8
  //TODO - pertinentInformation3
  pertinentInformation4: PrescriptionPertinentInformation4

  //TODO - inFulfillmentOf

  constructor(id: codes.GlobalIdentifier, shortFormId: codes.ShortFormPrescriptionIdentifier) {
    this.id = [id, shortFormId]
    this.code = new codes.SnomedCode("225426007", "Administration of therapeutic substance (procedure)")
    this.effectiveTime = core.Null.NOT_APPLICABLE
  }
}

/**
 * A link to the details of the patient's nominated pharmacy that they have indicated they wish the prescription to be
 * dispensed at.
 */
export class Performer implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextControlCode = {
    typeCode: "PRF",
    contextControlCode: "OP"
  }

  AgentOrgSDS: organization.AgentOrganization

  constructor(agentOrganization: organization.AgentOrganization) {
    this.AgentOrgSDS = agentOrganization
  }
}

/**
 * A participation used to provide a link to the prescriber who authored the prescription.
 */
export class Author implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextControlCode = {
    typeCode: "AUT",
    contextControlCode: "OP"
  }

  time: core.Timestamp
  signatureText: core.Null | ElementCompact
  AgentPerson: agentPerson.AgentPerson
}

/**
 * A participation used to provide a link to the healthcare professional who has direct responsibility for the patient.
 */
export class ResponsibleParty implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextControlCode = {
    typeCode: "RESP",
    contextControlCode: "OP"
  }

  AgentPerson: agentPerson.AgentPerson
}

/**
 * An act relationship used to provide information on the number of days' treatment that the current prescription's
 * medication provides for.
 * Applicable to repeat dispensing prescriptions only.
 */
export class Component1 {
  _attributes: core.AttributeTypeCode = {
    typeCode: "COMP"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(true)
  daysSupply: DaysSupply

  constructor(daysSupply: DaysSupply) {
    this.daysSupply = daysSupply
  }
}

/**
 * Prescription duration and supply intervals used to calculate the "Dispensing Window".
 * This information is mandatory for repeat dispensing prescriptions, optional otherwise.
 */
export class DaysSupply {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "SPLY",
    moodCode: "RQO"
  }

  code: codes.SnomedCode = new codes.SnomedCode("373784005", "Dispensing medication (procedure)")
  effectiveTime?: core.Interval<core.Timestamp>
  expectedUseTime?: core.IntervalUnanchored
}

/**
 * An act relationship to define the nature of the role played by the pharmacy in the act of dispensing.
 */
export class PrescriptionPertinentInformation1 implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
    typeCode: "PERT",
    contextConductionInd: "true"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(true)
  pertinentDispensingSitePreference: DispensingSitePreference

  constructor(pertinentDispensingSitePreference: DispensingSitePreference) {
    this.pertinentDispensingSitePreference = pertinentDispensingSitePreference
  }
}

/**
 * An act relationship to associate the prescribed medication (line items) to the prescription.
 */
export class PrescriptionPertinentInformation2 implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeInversionInd & core.AttributeContextConductionInd
    & core.AttributeNegationInd = {
      typeCode: "PERT",
      inversionInd: "false",
      contextConductionInd: "true",
      negationInd: "false"
    }

  seperatableInd: core.BooleanValue = new core.BooleanValue(true)
  templateId: codes.TemplateIdentifier = new codes.TemplateIdentifier("CSAB_RM-NPfITUK10.sourceOf2")
  pertinentLineItem: lineItem.LineItem

  constructor(pertinentLineItem: lineItem.LineItem) {
    this.pertinentLineItem = pertinentLineItem
  }
}

/**
 * An act relationship used to qualify the type of prescriber and a reason for the prescription.
 */
export class PrescriptionPertinentInformation4 implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
    typeCode: "PERT",
    contextConductionInd: "true"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(false)
  pertinentPrescriptionType: PrescriptionType

  constructor(pertinentPrescriptionType: PrescriptionType) {
    this.pertinentPrescriptionType = pertinentPrescriptionType
  }
}

/**
 * An act relationship used to provide information on repeat dispensing prescriptions, informing the dispenser of the
 * anticipated date of the review of the prescription details by the prescriber.
 */
export class PrescriptionPertinentInformation7 implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
    typeCode: "PERT",
    contextConductionInd: "true"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(false)
  pertinentReviewDate: ReviewDate

  constructor(pertinentReviewDate: ReviewDate) {
    this.pertinentReviewDate = pertinentReviewDate
  }
}

/**
 * An act relationship used to qualify the type of prescription (acute, repeat prescription or repeat dispensing).
 */
export class PrescriptionPertinentInformation5 implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
    typeCode: "PERT",
    contextConductionInd: "true"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(false)
  pertinentPrescriptionTreatmentType: PrescriptionTreatmentType

  constructor(pertinentPrescriptionTreatmentType: PrescriptionTreatmentType) {
    this.pertinentPrescriptionTreatmentType = pertinentPrescriptionTreatmentType
  }
}

/**
 * An Act Relationship that provides information about whether the patient was given a token.
 */
export class PrescriptionPertinentInformation8 implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
    typeCode: "PERT",
    contextConductionInd: "true"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(false)
  pertinentTokenIssued: TokenIssued

  constructor(pertinentTokenIssued: TokenIssued) {
    this.pertinentTokenIssued = pertinentTokenIssued
  }
}

export abstract class PrescriptionAnnotation implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "OBS",
    moodCode: "EVN"
  }

  code: codes.PrescriptionAnnotationCode

  constructor(code: codes.PrescriptionAnnotationCode) {
    this.code = code
  }
}

/**
 * Details about the type of prescription.
 */
export class PrescriptionTreatmentType extends PrescriptionAnnotation {
  value: codes.PrescriptionTreatmentTypeCode

  constructor(value: codes.PrescriptionTreatmentTypeCode) {
    super(new codes.PrescriptionAnnotationCode("PTT"))
    this.value = value
  }
}

/**
 * The nature of the role played by the Nominated Pharmacy in the act of dispensing the medication.
 */
export class DispensingSitePreference extends PrescriptionAnnotation {
  value: codes.DispensingSitePreferenceCode

  constructor(value: codes.DispensingSitePreferenceCode) {
    super(new codes.PrescriptionAnnotationCode("DSP"))
    this.value = value
  }
}

/**
 * Details of whether the patient was given a token.
 */
export class TokenIssued extends PrescriptionAnnotation {
  value: core.BooleanValue

  constructor(value: core.BooleanValue) {
    super(new codes.PrescriptionAnnotationCode("TI"))
    this.value = value
  }
}

/**
 * Details about the type of prescriber and a reason for the prescription.
 */
export class PrescriptionType extends PrescriptionAnnotation {
  value: codes.PrescriptionTypeCode

  constructor(value: codes.PrescriptionTypeCode) {
    super(new codes.PrescriptionAnnotationCode("PT"))
    this.value = value
  }
}

/**
 * For repeat dispensing prescriptions, these are the details about the date at which the prescriber would like to
 * review the patient with regard to their treatment with this set of medications.
 */
export class ReviewDate extends PrescriptionAnnotation {
  value: core.Timestamp

  constructor(value: core.Timestamp) {
    super(new codes.PrescriptionAnnotationCode("RD"))
    this.value = value
  }
}

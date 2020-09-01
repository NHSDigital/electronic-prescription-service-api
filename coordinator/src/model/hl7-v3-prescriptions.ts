import * as core from "./hl7-v3-datatypes-core"
import {
  AttributeClassCode,
  AttributeMoodCode,
  AttributeTypeCode,
  NumericValue,
  Timestamp
} from "./hl7-v3-datatypes-core"
import * as codes from "./hl7-v3-datatypes-codes"
import {GlobalIdentifier, ShortFormPrescriptionIdentifier, SnomedCode} from "./hl7-v3-datatypes-codes"
import * as peoplePlaces from "./hl7-v3-people-places"
import {ElementCompact} from "xml-js"

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
  AgentPerson: peoplePlaces.AgentPerson
}

/**
 * Medication line item in the prescription.
 */
export class LineItem implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "SBADM",
    moodCode: "RQO"
  }

  id: codes.GlobalIdentifier
  code: codes.SnomedCode
  effectiveTime: core.Null
  //TODO - repeatNumber
  product: Product
  component: LineItemComponent
  pertinentInformation1?: LineItemPertinentInformation1
  //TODO - pertinentInformation3
  pertinentInformation2: LineItemPertinentInformation2
  //TODO - inFulfillmentOf2
  //TODO - inFulfillmentOf1

  constructor(id: GlobalIdentifier) {
    this.id = id
    //TODO do we need to support child codes of this?
    this.code = new codes.SnomedCode("225426007", "Administration of therapeutic substance (procedure)")
    this.effectiveTime = core.Null.NOT_APPLICABLE
  }
}

/**
 * A participation that establishes product specific data for the medication prescribed.
 */
export class Product implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextControlCode = {
    typeCode: "PRD",
    contextControlCode: "OP"
  }

  manufacturedProduct: ManufacturedProduct

  constructor(manufacturedProduct: ManufacturedProduct) {
    this.manufacturedProduct = manufacturedProduct
  }
}

/**
 * Details about the physical characteristics of the treatment prescribed.
 */
export class ManufacturedProduct implements ElementCompact {
  _attributes: core.AttributeClassCode = {
    classCode: "MANU"
  }

  manufacturedRequestedMaterial: ManufacturedRequestedMaterial

  constructor(manufacturedRequestedMaterial: ManufacturedRequestedMaterial) {
    this.manufacturedRequestedMaterial = manufacturedRequestedMaterial
  }
}

/**
 * Description of the physical characteristics of the medication material.
 */
export class ManufacturedRequestedMaterial implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeDeterminerCode = {
    classCode: "MMAT",
    determinerCode: "KIND"
  }

  code: codes.SnomedCode

  constructor(code: codes.SnomedCode) {
    this.code = code
  }
}

/**
 * An act relationship used to denote the total amount of medication to be dispensed as a unit of measure.
 */
export class LineItemComponent implements ElementCompact {
  _attributes: core.AttributeTypeCode = {
    typeCode: "COMP"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(false)
  lineItemQuantity: LineItemQuantity

  constructor(lineItemQuantity: LineItemQuantity) {
    this.lineItemQuantity = lineItemQuantity
  }
}

/**
 * An act relationship to allow the specification of dosage instructions in human readable form.
 */
export class LineItemPertinentInformation2 implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
    typeCode: "PERT",
    contextConductionInd: "true"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(false)
  pertinentDosageInstructions: DosageInstructions

  constructor(pertinentDosageInstructions: DosageInstructions) {
    this.pertinentDosageInstructions = pertinentDosageInstructions
  }
}

/**
 * An act relationship used to associate additional medication instructions to the line item.
 */
export class LineItemPertinentInformation1 implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
    typeCode: "PERT",
    contextConductionInd: "true"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(false)
  pertinentAdditionalInstructions: AdditionalInstructions

  constructor(pertinentAdditionalInstructions: AdditionalInstructions) {
    this.pertinentAdditionalInstructions = pertinentAdditionalInstructions
  }
}

/**
 * Details about the total quantity of medication to be supplied for a prescription Line Item.
 */
export class LineItemQuantity implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "SPLY",
    moodCode: "RQO"
  }

  code: codes.SnomedCode = new codes.SnomedCode("373784005", "Dispensing medication (procedure)")
  quantity: core.QuantityInAlternativeUnits
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
  recordTarget: RecordTarget
  pertinentInformation1: ParentPrescriptionPertinentInformation1
  pertinentInformation2: ParentPrescriptionPertinentInformation2

  constructor(id: codes.GlobalIdentifier, effectiveTime: core.Timestamp) {
    this.id = id
    this.code = new codes.SnomedCode("163501000000109", "Prescription - FocusActOrEvent (record artifact)")
    this.effectiveTime = effectiveTime
    this.typeId = new codes.TypeIdentifier("PORX_MT132004UK31")
  }
}

/**
 * A link between the ParentPrescription and the patient who receives the medication treatment.
 */
export class RecordTarget implements ElementCompact {
  _attributes: core.AttributeTypeCode = {
    typeCode: "RCT"
  }

  Patient: peoplePlaces.Patient

  constructor(patient: peoplePlaces.Patient) {
    this.Patient = patient
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
  pertinentPrescription: Prescription

  constructor(pertinentPrescription: Prescription) {
    this.pertinentPrescription = pertinentPrescription
  }
}

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
  repeatNumber?: core.IntervalComplete<NumericValue>
  performer: Performer
  author: Author
  //TODO - legalAuthenticator
  responsibleParty: ResponsibleParty
  component1: Component1
  pertinentInformation7: PrescriptionPertinentInformation7
  pertinentInformation5: PrescriptionPertinentInformation5
  //TODO - pertinentInformation6
  pertinentInformation1: PrescriptionPertinentInformation1
  pertinentInformation2: Array<PrescriptionPertinentInformation2>
  pertinentInformation8: PrescriptionPertinentInformation8
  //TODO - pertinentInformation3
  pertinentInformation4: PrescriptionPertinentInformation4

  //TODO - inFulfillmentOf

  constructor(id: GlobalIdentifier, shortFormId: ShortFormPrescriptionIdentifier) {
    this.id = [id, shortFormId]
    this.code = new codes.SnomedCode("225426007", "Administration of therapeutic substance (procedure)")
    this.effectiveTime = core.Null.NOT_APPLICABLE
  }
}

/**
 * A link to the details of the patient's nominated pharmacy that they have indicated they wish the prescription to be dispensed at.
 */
export class Performer implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextControlCode = {
    typeCode: "PRF",
    contextControlCode: "OP"
  }

  AgentOrgSDS: peoplePlaces.AgentOrganization

  constructor(agentOrganization: peoplePlaces.AgentOrganization) {
    this.AgentOrgSDS = agentOrganization
  }
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
  _attributes: core.AttributeTypeCode & core.AttributeInversionInd & core.AttributeContextConductionInd & core.AttributeNegationInd = {
    typeCode: "PERT",
    inversionInd: "false",
    contextConductionInd: "true",
    negationInd: "false"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(true)
  templateId: codes.TemplateIdentifier = new codes.TemplateIdentifier("CSAB_RM-NPfITUK10.sourceOf2")
  pertinentLineItem: LineItem

  constructor(pertinentLineItem: LineItem) {
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

abstract class PrescriptionAnnotation implements ElementCompact {
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
 * The dosage and medication instructions in human readable form.
 */
export class DosageInstructions extends PrescriptionAnnotation {
  value: string

  constructor(value: string) {
    super(new codes.PrescriptionAnnotationCode("DI"))
    this.value = value
  }
}

/**
 * Additional Instructions provided with the prescription Line Item.
 */
export class AdditionalInstructions extends PrescriptionAnnotation {
  value: string

  constructor(value: string) {
    super(new codes.PrescriptionAnnotationCode("AI"))
    this.value = value
  }
}

/**
 * For repeat dispensing prescriptions, these are the details about the date at which the prescriber would like to
 * review the patient with regard to their treatment with this set of medications.
 */
export class ReviewDate extends PrescriptionAnnotation {
  value: Timestamp

  constructor(value: Timestamp) {
    super(new codes.PrescriptionAnnotationCode("RD"))
    this.value = value
  }
}

/**
 * A participation used to provide a link to the healthcare professional who has direct responsibility for the patient.
 */
export class ResponsibleParty implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextControlCode = {
    typeCode: "RESP",
    contextControlCode: "OP"
  }

  AgentPerson: peoplePlaces.AgentPerson
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
 * The CareRecordElementCategory act can reference multiple ActRef acts to 'group' multiple clinical statements under a single category.
 */
export class CareRecordElementCategory implements ElementCompact {
  _attributes: core.AttributeClassCode & AttributeMoodCode = {
    classCode: "CATEGORY",
    moodCode: "EVN"
  }

  code = new SnomedCode("185361000000102", "Medication - care record element (record artifact)")
  component: Array<CareRecordElementCategoryComponent>
}

/**
 * An act relationship used to convey that the ActRef act forms a component of the acts within the CareRecordElementCategory.
 */
export class CareRecordElementCategoryComponent implements ElementCompact {
  _attributes: AttributeTypeCode = {
    typeCode: "COMP"
  }

  actRef: ActRef

  constructor(actRef: ActRef) {
    this.actRef = actRef
  }
}

export interface Act {
  _attributes: AttributeClassCode & AttributeMoodCode
  id: GlobalIdentifier
}

/**
 * Reference to a clinical statement within this message.
 */
export class ActRef implements ElementCompact {
  _attributes: AttributeClassCode & AttributeMoodCode
  id: GlobalIdentifier

  constructor(act: Act) {
    this._attributes = {
      classCode: act._attributes.classCode,
      moodCode: act._attributes.moodCode
    }

    this.id = act.id
  }
}

/**
 * An act relationship used to provide information on the number of days' treatment that the current prescription's medication provides for.
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
  _attributes: core.AttributeClassCode & AttributeMoodCode = {
    classCode: "SPLY",
    moodCode: "RQO"
  }

  code: codes.SnomedCode = new codes.SnomedCode("373784005", "Dispensing medication (procedure)")
  effectiveTime: core.IntervalComplete<core.Timestamp>
  expectedUseTime: core.IntervalUnanchored
}

export class ParentPrescriptionRoot {
  ParentPrescription: ParentPrescription

  constructor(parentPrescription: ParentPrescription) {
    this.ParentPrescription = parentPrescription
  }
}

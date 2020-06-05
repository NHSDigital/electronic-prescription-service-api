import * as core from "./hl7-v3-datatypes-core"
import * as codes from "./hl7-v3-datatypes-codes"
import * as peoplePlaces from "./hl7-v3-people-places"

/**
 * A participation used to provide a link to the prescriber who authored the prescription.
 */
export class Author {
    _attributes: core.AttributeTypeCode & core.AttributeContextControlCode = {
        typeCode: "AUT",
        contextControlCode: "OP"
    }
    time: core.Timestamp
    signatureText: core.Null
    AgentPerson: peoplePlaces.AgentPerson
}

/**
 * Medication line item in the prescription.
 */
export class LineItem {
    _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
        classCode: "SBADM",
        moodCode: "RQO"
    }
    id: codes.GlobalIdentifier
    //TODO do we need to support child codes of this?
    code: codes.SnomedCode = new codes.SnomedCode("225426007", "administration of therapeutic substance (procedure)")
    effectiveTime: core.Null = core.Null.NOT_APPLICABLE
    //TODO - repeatNumber
    product: Product
    component: LineItemComponent
    //TODO - pertinentInformation1
    //TODO - pertinentInformation3
    pertinentInformation2: LineItemPertinentInformation2
    //TODO - inFulfillmentOf2
    //TODO - inFulfillmentOf1
}

/**
 * A participation that establishes product specific data for the medication prescribed.
 */
export class Product {
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
export class ManufacturedProduct {
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
export class ManufacturedRequestedMaterial {
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
export class LineItemComponent {
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
export class LineItemPertinentInformation2 {
    _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
        typeCode: "PERT",
        contextConductionInd: true
    }
    seperatableInd: core.BooleanValue = new core.BooleanValue(false)
    pertinentDosageInstructions: DosageInstructions

    constructor(pertinentDosageInstructions: DosageInstructions) {
        this.pertinentDosageInstructions = pertinentDosageInstructions
    }

}

/**
 * Details about the total quantity of medication to be supplied for a prescription Line Item.
 */
export class LineItemQuantity {
    _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
        classCode: "SPLY",
        moodCode: "RQO"
    }
    //TODO do we need to support child codes of this?
    code: codes.SnomedCode = new codes.SnomedCode("373784005", "dispensing medication")
    quantity: core.QuantityInAlternativeUnits
}

class ParentPrescriptionAttributes implements core.AttributeClassCode, core.AttributeMoodCode {
    xmlns: string = "urn:hl7-org:v3"
    "xmlns:xsi": string = "http://www.w3.org/2001/XMLSchema-instance"
    classCode: string = "INFO"
    moodCode: string = "EVN"
    "xsi:schemaLocation": string = "urn:hl7-org:v3 ..\\Schemas\\PORX_MT132004UK31.xsd"
}

/**
 * This is the parent prescription.
 *
 * Each item on a prescription has an administration part and a supply part.
 * In each case some of the information is common to each item while other information is different.
 * This act represents the common parts of the administration part of each item on a prescription.
 */
export class ParentPrescription {
    _attributes: ParentPrescriptionAttributes = new ParentPrescriptionAttributes()
    id: codes.GlobalIdentifier
    code: codes.SnomedCode = new codes.SnomedCode("163501000000109", "Prescription")
    effectiveTime: core.Timestamp
    typeId: codes.TypeIdentifier = new codes.TypeIdentifier("PORX_MT132004UK31")
    recordTarget: RecordTarget
    pertinentInformation1: ParentPrescriptionPertinentInformation1
    //TODO - pertinentInformation2
}

/**
 * A link between the ParentPrescription and the patient who receives the medication treatment.
 */
export class RecordTarget {
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
export class ParentPrescriptionPertinentInformation1 {
    _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
        typeCode: "PERT",
        contextConductionInd: true
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
export class Prescription {
    _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
        classCode: "SBADM",
        moodCode: "RQO"
    }
    id: [codes.GlobalIdentifier, codes.ShortFormPrescriptionIdentifier]
    //TODO do we need to support child codes of this?
    code: codes.SnomedCode = new codes.SnomedCode("225426007", "administration of therapeutic substance (procedure)")
    effectiveTime: core.Null = core.Null.NOT_APPLICABLE
    //TODO - repeatNumber
    //TODO - performer
    author: Author
    //TODO - legalAuthenticator
    responsibleParty: ResponsibleParty
    //TODO - component1
    //TODO - pertinentInformation7
    pertinentInformation5: PrescriptionPertinentInformation5
    //TODO - pertinentInformation6
    pertinentInformation1: PrescriptionPertinentInformation1
    pertinentInformation2: Array<PrescriptionPertinentInformation2>
    pertinentInformation8: PrescriptionPertinentInformation8
    //TODO - pertinentInformation3
    pertinentInformation4: PrescriptionPertinentInformation4
    //TODO - inFulfillmentOf
}

/**
 * An act relationship to define the nature of the role played by the pharmacy in the act of dispensing.
 */
export class PrescriptionPertinentInformation1 {
    _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
        typeCode: "PERT",
        contextConductionInd: true
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
export class PrescriptionPertinentInformation2 {
    _attributes: core.AttributeTypeCode & core.AttributeInversionInd & core.AttributeContextConductionInd & core.AttributeNegationInd = {
        typeCode: "PERT",
        inversionInd: false,
        contextConductionInd: true,
        negationInd: false
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
export class PrescriptionPertinentInformation4 {
    _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
        typeCode: "PERT",
        contextConductionInd: true
    }
    seperatableInd: core.BooleanValue = new core.BooleanValue(true)
    pertinentPrescriptionType: PrescriptionType

    constructor(pertinentPrescriptionType: PrescriptionType) {
        this.pertinentPrescriptionType = pertinentPrescriptionType
    }
}

/**
 * An act relationship used to qualify the type of prescription (acute, repeat prescription or repeat dispensing).
 */
export class PrescriptionPertinentInformation5 {
    _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
        typeCode: "PERT",
        contextConductionInd: true
    }
    seperatableInd: core.BooleanValue = new core.BooleanValue(true)
    pertinentPrescriptionTreatmentType: PrescriptionTreatmentType

    constructor(pertinentPrescriptionTreatmentType: PrescriptionTreatmentType) {
        this.pertinentPrescriptionTreatmentType = pertinentPrescriptionTreatmentType
    }
}

/**
 * An Act Relationship that provides information about whether the patient was given a token.
 */
export class PrescriptionPertinentInformation8 {
    _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
        typeCode: "PERT",
        contextConductionInd: true
    }
    seperatableInd: core.BooleanValue = new core.BooleanValue(true)
    pertinentTokenIssued: TokenIssued

    constructor(pertinentTokenIssued: TokenIssued) {
        this.pertinentTokenIssued = pertinentTokenIssued
    }
}

class PrescriptionAnnotation {
    _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
        classCode: "OBS",
        moodCode: "EVN"
    }
    code: codes.PrescriptionAnnotationCode
    value: any

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
        super(new codes.PrescriptionAnnotationCode("PTT"));
        this.value = value
    }
}

/**
 * The nature of the role played by the Nominated Pharmacy in the act of dispensing the medication.
 */
export class DispensingSitePreference extends PrescriptionAnnotation {
    value: codes.DispensingSitePreferenceCode

    constructor(value: codes.DispensingSitePreferenceCode) {
        super(new codes.PrescriptionAnnotationCode("DSP"));
        this.value = value
    }
}

/**
 * Details of whether the patient was given a token.
 */
export class TokenIssued extends PrescriptionAnnotation {
    value: core.BooleanValue

    constructor(value: core.BooleanValue) {
        super(new codes.PrescriptionAnnotationCode("TI"));
        this.value = value
    }
}

/**
 * Details about the type of prescriber and a reason for the prescription.
 */
export class PrescriptionType extends PrescriptionAnnotation {
    value: codes.PrescriptionTypeCode

    constructor(value: codes.PrescriptionTypeCode) {
        super(new codes.PrescriptionAnnotationCode("PT"));
        this.value = value
    }
}

/**
 * The dosage and medication instructions in human readable form.
 */
export class DosageInstructions extends PrescriptionAnnotation {
    value: string

    constructor(value: string) {
        super(new codes.PrescriptionAnnotationCode("DI"));
        this.value = value
    }
}

/**
 * A participation used to provide a link to the healthcare professional who has direct responsibility for the patient.
 */
export class ResponsibleParty {
    _attributes: core.AttributeTypeCode & core.AttributeContextControlCode = {
        typeCode: "RESP",
        contextControlCode: "OP"
    }
    AgentPerson: peoplePlaces.AgentPerson
}

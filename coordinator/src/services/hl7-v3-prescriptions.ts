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
    //TODO do we need to support child codes of this?
    code: codes.SnomedCode = new codes.SnomedCode("225426007", "administration of therapeutic substance (procedure)")
    effectiveTime: core.Null = core.Null.NOT_APPLICABLE
    product: Product
    component: LineItemComponent
    pertinentInformation2: LineItemPertinentInformation2
}

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

export class ManufacturedProduct {
    _attributes: core.AttributeClassCode = {
        classCode: "MANU"
    }
    manufacturedRequestedMaterial: ManufacturedRequestedMaterial

    constructor(manufacturedRequestedMaterial: ManufacturedRequestedMaterial) {
        this.manufacturedRequestedMaterial = manufacturedRequestedMaterial
    }
}

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

export class LineItemComponent {
    _attributes: core.AttributeTypeCode = {
        typeCode: "COMP"
    }
    seperatableInd: core.Bool = core.Bool.FALSE
    lineItemQuantity: LineItemQuantity

    constructor(lineItemQuantity: LineItemQuantity) {
        this.lineItemQuantity = lineItemQuantity
    }
}

export class LineItemPertinentInformation2 {
    _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
        typeCode: "PERT",
        contextConductionInd: "true"
    }
    seperatableInd: core.Bool = core.Bool.FALSE
    pertinentDosageInstructions: DosageInstructions

    constructor(pertinentDosageInstructions: DosageInstructions) {
        this.pertinentDosageInstructions = pertinentDosageInstructions
    }

}

export class LineItemQuantity {
    _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
        classCode: "SPLY",
        moodCode: "RQO"
    }
    //TODO do we need to support child codes of this?
    code: codes.SnomedCode = new codes.SnomedCode("373784005", "dispensing medication")
    quantity: core.QuantityInAlternativeUnits
}

/**
 * This is the parent prescription.
 *
 * Each item on a prescription has an administration part and a supply part.
 * In each case some of the information is common to each item while other information is different.
 * This act represents the common parts of the administration part of each item on a prescription.
 */
class ParentPrescriptionAttributes implements core.AttributeClassCode, core.AttributeMoodCode {
    xmlns: string = "urn:hl7-org:v3"
    "xmlns:xsi": string = "http://www.w3.org/2001/XMLSchema-instance"
    classCode: string = "INFO"
    moodCode: string = "EVN"
    "xsi:schemaLocation": string = "urn:hl7-org:v3 ..\\Schemas\\PORX_MT132004UK31.xsd"
}

export class ParentPrescription {
    _attributes: ParentPrescriptionAttributes = new ParentPrescriptionAttributes()
    id: codes.GlobalIdentifier
    code: codes.SnomedCode = new codes.SnomedCode("163501000000109", "Prescription")
    typeId: codes.TypeIdentifier = new codes.TypeIdentifier("PORX_MT132004UK31")
    effectiveTime: core.Timestamp
    recordTarget: RecordTarget
    pertinentInformation1: ParentPrescriptionPertinentInformation1
}

export class RecordTarget {
    _attributes: core.AttributeTypeCode = {
        typeCode: "RCT"
    }
    Patient: peoplePlaces.Patient

    constructor(patient: peoplePlaces.Patient) {
        this.Patient = patient
    }
}

export class ParentPrescriptionPertinentInformation1 {
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
export class Prescription {
    _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
        classCode: "SBADM",
        moodCode: "RQO"
    }
    id: Array<codes.GlobalIdentifier | codes.ShortFormPrescriptionIdentifier>
    //TODO do we need to support child codes of this?
    code: codes.SnomedCode = new codes.SnomedCode("225426007", "administration of therapeutic substance (procedure)")
    effectiveTime: core.Null = core.Null.NOT_APPLICABLE
    author: Author
    responsibleParty: ResponsibleParty
    pertinentInformation2: Array<PrescriptionPertinentInformation2> = []
    pertinentInformation5: PrescriptionPertinentInformation5
    pertinentInformation1: PrescriptionPertinentInformation1
    pertinentInformation8: PrescriptionPertinentInformation8
    pertinentInformation4: PrescriptionPertinentInformation4
}

export class PrescriptionPertinentInformation2 {
    _attributes: core.AttributeTypeCode & core.AttributeInversionInd & core.AttributeContextConductionInd & core.AttributeNegationInd = {
        typeCode: "PERT",
        inversionInd: "false",
        contextConductionInd: "true",
        negationInd: "false"
    }
    seperatableInd: core.Bool = core.Bool.TRUE
    templateId: codes.TemplateIdentifier = new codes.TemplateIdentifier("CSAB_RM-NPfITUK10.sourceOf2")
    pertinentLineItem: LineItem

    constructor(pertinentLineItem: LineItem) {
        this.pertinentLineItem = pertinentLineItem
    }
}

export class PrescriptionPertinentInformation5 {
    _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
        typeCode: "PERT",
        contextConductionInd: "true"
    }
    seperatableInd: core.Bool = core.Bool.TRUE
    pertinentPrescriptionTreatmentType: PrescriptionTreatmentType

    constructor(pertinentPrescriptionTreatmentType: PrescriptionTreatmentType) {
        this.pertinentPrescriptionTreatmentType = pertinentPrescriptionTreatmentType
    }
}

export class PrescriptionPertinentInformation1 {
    _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
        typeCode: "PERT",
        contextConductionInd: "true"
    }
    seperatableInd: core.Bool = core.Bool.TRUE
    pertinentDispensingSitePreference: DispensingSitePreference

    constructor(pertinentDispensingSitePreference: DispensingSitePreference) {
        this.pertinentDispensingSitePreference = pertinentDispensingSitePreference
    }
}

export class PrescriptionPertinentInformation8 {
    _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
        typeCode: "PERT",
        contextConductionInd: "true"
    }
    seperatableInd: core.Bool = core.Bool.TRUE
    pertinentTokenIssued: TokenIssued

    constructor(pertinentTokenIssued: TokenIssued) {
        this.pertinentTokenIssued = pertinentTokenIssued
    }
}

export class PrescriptionPertinentInformation4 {
    _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
        typeCode: "PERT",
        contextConductionInd: "true"
    }
    seperatableInd: core.Bool = core.Bool.TRUE
    pertinentPrescriptionType: PrescriptionType

    constructor(pertinentPrescriptionType: PrescriptionType) {
        this.pertinentPrescriptionType = pertinentPrescriptionType
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

export class PrescriptionTreatmentType extends PrescriptionAnnotation {
    value: codes.PrescriptionTreatmentTypeCode

    constructor(value: codes.PrescriptionTreatmentTypeCode) {
        super(new codes.PrescriptionAnnotationCode("PTT"));
        this.value = value
    }
}

export class DispensingSitePreference extends PrescriptionAnnotation {
    value: codes.DispensingSitePreferenceCode

    constructor(value: codes.DispensingSitePreferenceCode) {
        super(new codes.PrescriptionAnnotationCode("DSP"));
        this.value = value
    }
}

export class TokenIssued extends PrescriptionAnnotation {
    value: core.Bool

    constructor(value: core.Bool) {
        super(new codes.PrescriptionAnnotationCode("TI"));
        this.value = value
    }
}

export class PrescriptionType extends PrescriptionAnnotation {
    value: codes.PrescriptionTypeCode

    constructor(value: codes.PrescriptionTypeCode) {
        super(new codes.PrescriptionAnnotationCode("PT"));
        this.value = value
    }
}

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

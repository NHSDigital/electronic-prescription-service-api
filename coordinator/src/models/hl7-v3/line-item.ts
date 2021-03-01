import {ElementCompact} from "xml-js"
import * as core from "./core"
import * as codes from "./codes"
import * as prescription from "./prescription"

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
  repeatNumber?: core.Interval<core.NumericValue>
  product: Product
  component: LineItemComponent
  pertinentInformation4?: LineItemPertinentInformation4
  pertinentInformation1?: LineItemPertinentInformation1
  pertinentInformation3?: Array<LineItemPertinentInformation3>
  pertinentInformation2: LineItemPertinentInformation2
  //TODO - inFulfillmentOf2
  //TODO - inFulfillmentOf1

  constructor(id: codes.GlobalIdentifier) {
    this.id = id
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
 * An act relationship to endorse a controlled drug.
 */
export class LineItemPertinentInformation3 implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
    typeCode: "PERT",
    contextConductionInd: "true"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(false)
  pertinentPrescriberEndorsement: PrescriptionEndorsement

  constructor(pertinentPrescriberEndorsement: PrescriptionEndorsement) {
    this.pertinentPrescriberEndorsement = pertinentPrescriberEndorsement
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
 * Used in dispensing messages only!
 * Link to the status of the prescription line item at the point of the release event.
 */
export class LineItemPertinentInformation4 implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
    typeCode: "PERT",
    contextConductionInd: "true"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(false)
  pertinentItemStatus: ItemStatus

  constructor(pertinentItemStatus: ItemStatus) {
    this.pertinentItemStatus = pertinentItemStatus
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
 * Details about the prescriber's endorsement of a controlled drug.
 */
export class PrescriptionEndorsement extends prescription.PrescriptionAnnotation {
  value: codes.PrescriptionEndorsementCode

  constructor(value: codes.PrescriptionEndorsementCode) {
    super(new codes.PrescriptionAnnotationCode("PE"))
    this.value = value
  }
}

/**
 * The dosage and medication instructions in human readable form.
 */
export class DosageInstructions extends prescription.PrescriptionAnnotation {
  value: core.Text

  constructor(value: string) {
    super(new codes.PrescriptionAnnotationCode("DI"))
    this.value = new core.Text(value)
  }
}

/**
 * Additional Instructions provided with the prescription Line Item.
 */
export class AdditionalInstructions extends prescription.PrescriptionAnnotation {
  value: core.Text

  constructor(value: string) {
    super(new codes.PrescriptionAnnotationCode("AI"))
    this.value = new core.Text(value)
  }
}

/**
 * Describes the status of the prescription Line Item as a result of the dispense event.
 */
export class ItemStatus extends prescription.PrescriptionAnnotation {
  value: codes.ItemStatusCode

  constructor(value: codes.ItemStatusCode) {
    super(new codes.PrescriptionAnnotationCode("IS"))
    this.value = value
  }
}

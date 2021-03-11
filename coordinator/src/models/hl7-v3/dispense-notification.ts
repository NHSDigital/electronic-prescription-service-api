import * as core from "./core"
import * as codes from "./codes"
import {ElementCompact} from "xml-js"
import * as parentPrescription from "./parent-prescription"
import * as organisation from "./organization"
import * as prescription from "./prescription"
import * as lineItem from "./line-item"
import * as patient from "./patient"

export class DispenseNotificationRoot {
  DispenseNotification: DispenseNotification

  constructor(dispenseNotification: DispenseNotification) {
    this.DispenseNotification = dispenseNotification
  }
}

export class DispenseNotification implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "INFO",
    moodCode: "EVN"
  }
  id: codes.GlobalIdentifier
  code: codes.SnomedCode
  effectiveTime: core.Timestamp
  typeId: codes.TypeIdentifier
  recordTarget: DispenseRecordTarget
  primaryInformationRecipient: PrimaryInformationRecipient
  pertinentInformation1: DispenseNotificationPertinentInformation1
  pertinentInformation2: DispensePertinentInformation2
  sequelTo: SequelTo

  constructor(id: codes.GlobalIdentifier) {
    this.id = id
    this.code = new codes.SnomedCode(
      "163541000000107",
      "Dispensed Medication - FocusActOrEvent (administrative concept)"
    )
    this.effectiveTime = new core.Timestamp("PLACEHOLDER")
    this.typeId = new codes.TypeIdentifier("PORX_MT024001UK31")
  }
}

export class PrimaryInformationRecipient implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextControlCode = {
    typeCode: "PRCP",
    contextControlCode: "ON"
  }

  AgentOrg: organisation.AgentOrganization

  constructor(organisation: organisation.AgentOrganization) {
    this.AgentOrg = organisation
  }
}

/*
* A link to the patient who has received the medication treatment.
*/
export class DispenseRecordTarget implements ElementCompact {
  _attributes: core.AttributeTypeCode = {
    typeCode: "RCT"
  }

  patient: patient.Patient

  constructor(patient: patient.Patient) {
    this.patient = patient
  }
}

/*
 * An act relationship that associates the DispenseNotification focal act with
 * SupplyHeader - the primary act of the PSIS clinical message.
 */
export class DispenseNotificationPertinentInformation1 implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
    typeCode: "PERT",
    contextConductionInd: "true"
  }

  templateId: codes.TemplateIdentifier = new codes.TemplateIdentifier("CSAB_RM-NPfITUK10.pertinentInformation")
  pertinentSupplyHeader: PertinentSupplyHeader

  constructor(pertinentSupplyHeader: PertinentSupplyHeader) {
    this.pertinentSupplyHeader = pertinentSupplyHeader
  }
}

/*
 * An act relationship that provides information about the actual supplied Line Item (medication).
 */
export class DispenseNotificationPertinentInformation1LineItem implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
    typeCode: "PERT",
    contextConductionInd: "true",
    inversionInd: "false",
    negationInd: "false"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(false)
  templateId: codes.TemplateIdentifier = new codes.TemplateIdentifier("CSAB_RM-NPfITUK10.sourceOf2")
  pertinentSuppliedLineItem: PertinentSuppliedLineItem

  constructor(pertinentSuppliedLineItem : PertinentSuppliedLineItem ) {
    this.pertinentSuppliedLineItem  = pertinentSuppliedLineItem
  }
}

/*
* Details about the medication Line Item dispensed to satisfy the requirements for the treatment specified
* in the Prescription Line Item.
*/
export class PertinentSuppliedLineItem implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "SBADM",
    moodCode: "PRMS"
  }

  id: codes.GlobalIdentifier
  code: codes.SnomedCode
  effectiveTime: core.Null
  repeatNumber: undefined // todo dispenseNotification: handle repeats
  // todo dispenseNotification:? mim says do not use but will be available in future circa many years ago
  doseQuantity: undefined
  // todo dispenseNotification: ? mim says do not use but will be available in future circa many years ago
  rateQuantity: undefined
  consumable: Consumable
  component: DispenseLineItemComponent
  component1: DispenseLineItemComponent1
  pertinentInformation3: DispenseLineItemPertinentInformation3
  inFulfillmentOf: InFulfillmentOfLineItem

  constructor(id: codes.GlobalIdentifier, code: codes.SnomedCode) {
    this.id = id
    this.code = code
    this.effectiveTime = core.Null.NOT_APPLICABLE
  }
}

/*
* An act relationship that considers the status of the original prescription Line Item
* prior to the dispense of the medication.
*/
export class DispenseLineItemPertinentInformation3 implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
    typeCode: "PERT",
    contextConductionInd : "true"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(false)
  pertinentItemStatus: PertinentItemStatus

  constructor(pertinentItemStatus: PertinentItemStatus) {
    this.pertinentItemStatus= pertinentItemStatus
  }
}

/*
* Describes the status of the prescription Line Item as a result of the dispense event.
*/
export class PertinentItemStatus implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "OBS",
    moodCode: "EVN"
  }

  code: codes.PrescriptionAnnotationCode
  value: codes.ItemStatusCode

  constructor(value: codes.ItemStatusCode) {
    this.code = new codes.PrescriptionAnnotationCode("IS")
    this.value= value
  }
}

/*
* An act relationship to denote that this medication dispense is
* satisfying the requirements from the original prescription.
*/
export class InFulfillmentOf implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeInversionInd & core.AttributeNegationInd = {
    typeCode: "FLFS",
    inversionInd: "false",
    negationInd: "false"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(true)
  templateId: codes.TemplateIdentifier
  priorOriginalPrescriptionRef: PriorOriginalRef

  constructor(priorOriginalPrescriptionRef: PriorOriginalRef) {
    this.templateId = new codes.TemplateIdentifier("CSAB_RM-NPfITUK10.sourceOf1")
    this.priorOriginalPrescriptionRef = priorOriginalPrescriptionRef
  }
}

/*
* An act relationship to determine that this medication Line Item Dispense event satisifies the
* treatment ordered in the original prescription Line Item which is identified by the prescription
* Line Item id. Details on the original treatment ordered are determined through an act ref that
* points to the data on PSIS.
*/
export class InFulfillmentOfLineItem implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeInversionInd & core.AttributeNegationInd = {
    typeCode: "FLFS",
    inversionInd: "false",
    negationInd: "false"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(true)
  templateId: codes.TemplateIdentifier
  priorOriginalItemRef: PriorOriginalRef

  constructor(priorOriginalItemRef: PriorOriginalRef) {
    this.templateId = new codes.TemplateIdentifier("CSAB_RM-NPfITUK10.sourceOf1")
    this.priorOriginalItemRef = priorOriginalItemRef
  }
}

export class PriorOriginalRef implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode= {
    classCode: "SBADM",
    moodCode: "RQO"
  }

  id: codes.GlobalIdentifier

  constructor(id: codes.GlobalIdentifier) {
    this.id = id
  }
}

/*
* Provides information against the original prescription Line Item against which
* this medication is being dispensed. In this instance, the original prescription
* Line Item is not automatically cross-referenced to reduce overhead on PSIS, so
* the data may be derived from alternative sources which may include visual inspection
* of the prescription by the dispenser.
*/
export class Consumable implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextControlCode = {
    typeCode: "CSM",
    contextControlCode: "OP"
  }

  requestedManufacturedProduct: RequestedManufacturedProduct

  constructor(requestedManufacturedProduct: RequestedManufacturedProduct) {
    this.requestedManufacturedProduct = requestedManufacturedProduct
  }
}

/*
* Details of the treatment ordered on the prescription Line Item.
* May not be queried from PSIS but sourced from elsewhere.
*/
export class RequestedManufacturedProduct implements ElementCompact {
  _attributes: core.AttributeClassCode = {
    classCode: "MANU"
  }
  manufacturedRequestedMaterial: lineItem.ManufacturedRequestedMaterial

  constructor(manufacturedRequestedMaterial: lineItem.ManufacturedRequestedMaterial) {
    this.manufacturedRequestedMaterial = manufacturedRequestedMaterial
  }
}

/*
* A container for the collection of clinical statements that constitute Dispense Notification information
* to be available on PSIS.
*/
export class PertinentSupplyHeader implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "SBADM",
    moodCode: "EVN"
  }

  id: codes.GlobalIdentifier
  code: codes.SnomedCode
  effectiveTime: core.Null
  author: prescription.Author
  pertinentInformation1: Array<DispenseNotificationPertinentInformation1LineItem>
  pertinentInformation3: DispensePertinentInformation3
  pertinentInformation4: DispensePertinentInformation4
  inFulfillmentOf: InFulfillmentOf

  constructor(id: codes.GlobalIdentifier) {
    this.id = id
    this.code = new codes.SnomedCode("225426007")
    this.effectiveTime = core.Null.NOT_APPLICABLE
  }
}

/*
* An act relationship to provide information on the actual quantity of medication dispensed in this Dispense event.
*/
export class DispenseLineItemComponent implements ElementCompact {
  _attributes: core.AttributeTypeCode = {
    typeCode: "COMP"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(false)
  suppliedLineItemQuantity: SuppliedLineItemQuantity

  constructor(suppliedLineItemQuantity: SuppliedLineItemQuantity) {
    this.suppliedLineItemQuantity = suppliedLineItemQuantity
  }
}

/*
* An act relationship that relates to the quantity of the medication treatment ordered in the original
* prescription line item. This information might not necessarily be derived from PSIS.
*/
export class DispenseLineItemComponent1 implements ElementCompact {
  _attributes: core.AttributeTypeCode = {
    typeCode: "COMP"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(false)
  supplyRequest: SupplyRequest

  constructor(supplyRequest: SupplyRequest) {
    this.supplyRequest = supplyRequest
  }
}

/*
* Details of the quantity of medication requested.
*/
export class SupplyRequest implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeClassCode = {
    classCode: "SPLY",
    moodCode: "RQO"
  }

  code: codes.SnomedCode
  quantity: core.QuantityInAlternativeUnits

  constructor(code: codes.SnomedCode, quantity: core.QuantityInAlternativeUnits) {
    this.code = code
    this.quantity = quantity
  }
}

/*
* Details of the actual medication treatment dispensed in this Dispense event for this Line Item.
*/
export class SuppliedLineItemQuantity implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "SPLY",
    moodCode: "EVN"
  }

  code: codes.SnomedCode
  quantity: core.QuantityInAlternativeUnits
  product: DispenseProduct
  pertinentInformation1: DispenseLineItemPertinentInformation1
}

/*
* This act relationship enables tracking of partial dispenses through the monitor of total medication dispensed to-date.
*/
export class DispenseLineItemPertinentInformation1 implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
    typeCode: "PERT",
    contextConductionInd: "true"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(false)
  pertinentSupplyInstructions: PertinentSupplyInstructions

  constructor(pertinentSupplyInstructions : PertinentSupplyInstructions) {
    this.pertinentSupplyInstructions = pertinentSupplyInstructions
  }
}

/*
* Medication administration instructions as supplied by the dispenser and printed on the supplied items.
* Normally, these should be the same as the prescriber instructions except when the supplied medication
* varies from the prescribed medication requiring more drug specification information.
*/
export class PertinentSupplyInstructions  implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "OBS",
    moodCode: "EVN"
  }

  code: codes.PrescriptionAnnotationCode
  value: core.Text

  constructor(value: core.Text) {
    this.code = new codes.PrescriptionAnnotationCode("SI")
    this.value = value
  }
}

/**
 * A participation that establishes product specific data for the medication prescribed.
 */
export class DispenseProduct implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextControlCode = {
    typeCode: "PRD",
    contextControlCode: "OP"
  }

  suppliedManufacturedProduct: SuppliedManufacturedProduct

  constructor(suppliedManufacturedProduct: SuppliedManufacturedProduct) {
    this.suppliedManufacturedProduct = suppliedManufacturedProduct
  }
}

/**
 * Details about the physical characteristics of the treatment prescribed.
 */
export class SuppliedManufacturedProduct implements ElementCompact {
  _attributes: core.AttributeClassCode = {
    classCode: "MANU"
  }

  manufacturedSuppliedMaterial: lineItem.ManufacturedRequestedMaterial

  constructor(manufacturedSuppliedMaterial: lineItem.ManufacturedRequestedMaterial) {
    this.manufacturedSuppliedMaterial = manufacturedSuppliedMaterial
  }
}

/*
* An identifier of the Act Relationship that relates clinical statements directly to the focal act.
*/
export class DispensePertinentInformation2 implements ElementCompact {
  _attributes: core.AttributeTypeCode = {
    typeCode: "PERT"
  }

  templateId: codes.TemplateIdentifier = new codes.TemplateIdentifier("CSAB_RM-NPfITUK10.pertinentInformation1")
  pertinentCareRecordElementCategory : parentPrescription.CareRecordElementCategory

  constructor(pertinentCareRecordElementCategory: parentPrescription.CareRecordElementCategory) {
    this.pertinentCareRecordElementCategory = pertinentCareRecordElementCategory
  }
}

/*
* Details of the status of the Prescription as a function of the dispense progress of the individual medication items.
*/
export class DispensePertinentInformation3 implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
    typeCode: "PERT",
    contextConductionInd: "true"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(false)
  pertinentPrescriptionStatus: PertinentPrescriptionStatus

  constructor(pertinentPrescriptionStatus: PertinentPrescriptionStatus) {
    this.pertinentPrescriptionStatus = pertinentPrescriptionStatus
  }
}

/*
* A link to the identify the original prescription.
*/
export class DispensePertinentInformation4 implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
    typeCode: "PERT",
    contextConductionInd: "true"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(false)
  pertinentPrescriptionID: PertinentPrescriptionId

  constructor(pertinentPrescriptionID: PertinentPrescriptionId) {
    this.pertinentPrescriptionID  = pertinentPrescriptionID
  }
}

/*
* A reference to the original prescription clinical event.
*/
export class PertinentPrescriptionId implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "OBS",
    moodCode: "EVN"
  }

  code: codes.PrescriptionAnnotationCode
  value: codes.ShortFormPrescriptionIdentifier

  constructor(value: codes.ShortFormPrescriptionIdentifier) {
    this.code = new codes.PrescriptionAnnotationCode("PID")
    this.value = value
  }
}

/*
* Details of the  status of the overall prescription as a function of the respective Medication item statuses.
*/
export class PertinentPrescriptionStatus implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "OBS",
    moodCode: "EVN"
  }

  code: codes.PrescriptionAnnotationCode
  value: codes.StatusCode

  constructor(value: codes.StatusCode) {
    this.code = new codes.PrescriptionAnnotationCode("PS")
    this.value = value
  }
}

/*
* An act relationship indicating that Dispense Notification sequentially follows the Prescription Release Event.
*/
export class SequelTo implements ElementCompact {
  _attributes: core.AttributeTypeCode = {
    typeCode: "SEQL"
  }

  priorPrescriptionReleaseEventRef: PriorPrescriptionReleaseEventRef

  constructor(priorPrescriptionReleaseEventRef: PriorPrescriptionReleaseEventRef) {
    this.priorPrescriptionReleaseEventRef = priorPrescriptionReleaseEventRef
  }
}

/*
* Details about the Patient Prescription Release Response or the Nominated Prescription Release Response
* that authorised the Dispense event.
*/
export class PriorPrescriptionReleaseEventRef implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "INFO",
    moodCode: "RQO"
  }

  id: codes.GlobalIdentifier

  constructor(id: codes.GlobalIdentifier) {
    this.id = id
  }
}

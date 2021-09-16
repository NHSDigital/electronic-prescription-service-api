import { ElementCompact } from "xml-js"
import { AgentPerson } from "./agent-person"
import * as codes from "./codes"
import * as core from "./core"
import { Consumable, DispenseLineItemComponent, DispenseLineItemComponent1, DispenseLineItemPertinentInformation3, DispensePertinentInformation1, DispensePertinentInformation1LineItem, DispensePertinentInformation3, DispensePertinentInformation4, DispenseProduct, InFulfillmentOf, InFulfillmentOfLineItem, PertinentSuppliedLineItem, PertinentSupplyHeader, PrimaryInformationRecipient, SequelTo } from "./dispense-common"
import { PrescriptionAuthor } from "./prescription"

export class DispenseClaimInformationRoot {
  DispenseClaimInformation: DispenseClaimInformation

  constructor(dispenseClaimInformation: DispenseClaimInformation) {
    this.DispenseClaimInformation = dispenseClaimInformation
  }
}

export class DispenseClaimInformation implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "INFO",
    moodCode: "EVN"
  }
  
  id: codes.GlobalIdentifier
  code: codes.SnomedCode
  effectiveTime: core.Timestamp
  typeId: codes.TypeIdentifier
  primaryInformationRecipient: PrimaryInformationRecipient
  pertinentInformation1: DispensePertinentInformation1<DispenseClaimPertinentSupplyHeader>
  sequelTo: SequelTo

  constructor(id: codes.GlobalIdentifier, effectiveTime: core.Timestamp) {
    this.id = id
    this.code = new codes.SnomedCode(
      "163541000000107",
      "Dispensed Medication - FocusActOrEvent (administrative concept)"
    )
    this.effectiveTime = effectiveTime
    this.typeId = new codes.TypeIdentifier("PORX_MT142001UK31")
  }
}

export class DispenseClaimPertinentSupplyHeader implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
      classCode: "SBADM",
      moodCode: "EVN"
  }

  id: codes.GlobalIdentifier
  code: codes.SnomedCode
  effectiveTime: core.Null
  repeatNumber?: core.Interval<core.NumericValue>
  pertinentInformation1: Array<DispenseClaimPertinentInformation1LineItem> // Line item information
  pertinentInformation3: DispensePertinentInformation3 // Prescription Status
  pertinentInformation4: DispensePertinentInformation4 // Prescription ID
  inFulfillmentOf: InFulfillmentOf
  legalAuthenticator: LegalAuthenticator

  constructor(id: codes.GlobalIdentifier) {
      this.id = id
      this.code = new codes.SnomedCode("225426007")
      this.effectiveTime = core.Null.NOT_APPLICABLE
  }
}

export class DispenseClaimPertinentInformation1LineItem implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
      typeCode: "PERT",
      contextConductionInd: "true",
      inversionInd: "false",
      negationInd: "false"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(false)
  templateId: codes.TemplateIdentifier = new codes.TemplateIdentifier("CSAB_RM-NPfITUK10.sourceOf2")
  pertinentSuppliedLineItem: DispenseClaimPertinentSuppliedLineItem

  constructor(pertinentSuppliedLineItem: DispenseClaimPertinentSuppliedLineItem) {
      this.pertinentSuppliedLineItem = pertinentSuppliedLineItem
  }
}

export class DispenseClaimPertinentSuppliedLineItem implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
      classCode: "SBADM",
      moodCode: "PRMS"
  }

  id: codes.GlobalIdentifier
  code: codes.SnomedCode
  effectiveTime: core.Null
  repeatNumber?: core.Interval<core.NumericValue>
  component: DispenseClaimLineItemComponent // Link line item to dispensed quantity
  pertinentInformation3: DispenseLineItemPertinentInformation3 // Prescription line item status
  inFulfillmentOf: InFulfillmentOfLineItem

  constructor(id: codes.GlobalIdentifier, code: codes.SnomedCode) {
      this.id = id
      this.code = code
      this.effectiveTime = core.Null.NOT_APPLICABLE
  }
}

export class DispenseClaimLineItemComponent implements ElementCompact {
  _attributes: core.AttributeTypeCode = {
      typeCode: "COMP"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(false)
  suppliedLineItemQuantity: DispenseClaimSuppliedLineItemQuantity

  constructor(suppliedLineItemQuantity: DispenseClaimSuppliedLineItemQuantity) {
      this.suppliedLineItemQuantity = suppliedLineItemQuantity
  }
}

export class DispenseClaimSuppliedLineItemQuantity implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
      classCode: "SPLY",
      moodCode: "EVN"
  }

  code: codes.SnomedCode
  quantity: core.QuantityInAlternativeUnits
  product: DispenseProduct
  pertinentInformation1: DispenseClaimLineItemPertinentInformation1 // Line item details
  pertinentInformation2: Array<DispenseClaimLineItemPertinentInformation2> // Endorsements

  constructor(
    code: codes.SnomedCode,
    quantity: core.QuantityInAlternativeUnits,
    product: DispenseProduct,
    pertinentInformation1: DispenseClaimLineItemPertinentInformation1,
    pertinentInformation2: Array<DispenseClaimLineItemPertinentInformation2>) {
    this.code = code,
    this.quantity = quantity,
    this.product = product,
    this.pertinentInformation1 = pertinentInformation1,
    this.pertinentInformation2 = pertinentInformation2
  }
}

export class DispenseClaimLineItemPertinentInformation2 implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
    typeCode: "PERT",
    contextConductionInd: "true"
  }

  seperatableInd: core.BooleanValue
  pertinentDispensingEndorsement: DispensingEndorsement

  constructor(pertinentDispensingEndorsement: DispensingEndorsement) {
    this.pertinentDispensingEndorsement = pertinentDispensingEndorsement
    this.seperatableInd = new core.BooleanValue(true)
  }
}

export class DispenseClaimLineItemPertinentInformation1 implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
      typeCode: "PERT",
      contextConductionInd: "true"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(false)
  pertinentChargePayment: DispenseClaimChargePayment

  constructor(pertinentChargePayment: DispenseClaimChargePayment) {
      this.pertinentChargePayment = pertinentChargePayment
  }
}

export class DispenseClaimChargePayment implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "OBS",
    moodCode: "EVN"
  }

  value: Boolean
  code: codes.PrescriptionAnnotationCode

  constructor(value: Boolean) {
    this.value = value
    this.code = new codes.PrescriptionAnnotationCode("CP")
  }
}

export class DispensingEndorsement implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "OBS",
    moodCode: "EVN"
  }

  text: String
  code: codes.PrescriptionAnnotationCode
  value: codes.DispensingEndorsementCode

  constructor(text: String, value: codes.DispensingEndorsementCode) {
    this.text = text
    this.code = new codes.PrescriptionAnnotationCode("DE")
    this.value = value
  }
}


export class LegalAuthenticator extends PrescriptionAuthor {
  _attributes: core.AttributeTypeCode & core.AttributeContextControlCode = {
    typeCode: "LA",
    contextControlCode: "OP"
  }

  constructor(participant: AgentPerson, time: core.Timestamp) {
    super()
    this.time = time
    this.AgentPerson = participant
    this.signatureText = core.Null.NOT_APPLICABLE
  }
}


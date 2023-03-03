import {ElementCompact} from "xml-js"
import * as codes from "./codes"
import * as core from "./core"
import * as dispenseCommon from "./dispense-common"
import * as prescription from "./prescription"
import * as organisation from "./organization"

export class DispenseClaimRoot {
  DispenseClaim: DispenseClaim

  constructor(dispenseClaim: DispenseClaim) {
    this.DispenseClaim = dispenseClaim
  }
}

export class DispenseClaim implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "INFO",
    moodCode: "EVN"
  }

  id: codes.GlobalIdentifier
  code: codes.SnomedCode
  effectiveTime: core.Timestamp
  typeId: codes.TypeIdentifier
  primaryInformationRecipient: DispenseClaimPrimaryInformationRecipient
  //TODO - receiver
  pertinentInformation1: DispenseClaimPertinentInformation1
  //TODO - pertinentInformation2
  replacementOf: dispenseCommon.ReplacementOf
  coverage: Coverage
  sequelTo: dispenseCommon.SequelTo

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

export class DispenseClaimPrimaryInformationRecipient implements ElementCompact {
  _attributes: core.AttributeTypeCode = {
    typeCode: "PRCP"
  }

  AgentOrg: organisation.AgentOrganization

  constructor(organisation: organisation.AgentOrganization) {
    this.AgentOrg = organisation
  }
}

export class DispenseClaimPertinentInformation1 implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
    typeCode: "PERT",
    contextConductionInd: "true"
  }

  templateId: codes.TemplateIdentifier = new codes.TemplateIdentifier("CSAB_RM-NPfITUK10.pertinentInformation")
  pertinentSupplyHeader: DispenseClaimSupplyHeader

  constructor(supplyHeader: DispenseClaimSupplyHeader) {
    this.pertinentSupplyHeader = supplyHeader
  }
}

export class DispenseClaimSupplyHeader {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "SBADM",
    moodCode: "EVN"
  }

  id: codes.GlobalIdentifier
  code: codes.SnomedCode
  effectiveTime: core.Null
  repeatNumber?: core.Interval<core.NumericValue>
  pertinentInformation1: Array<DispenseClaimSupplyHeaderPertinentInformation1>
  pertinentInformation2?: DispenseClaimSupplyHeaderPertinentInformation2
  pertinentInformation3: dispenseCommon.SupplyHeaderPertinentInformation3
  pertinentInformation4: dispenseCommon.SupplyHeaderPertinentInformation4
  inFulfillmentOf: dispenseCommon.InFulfillmentOf
  legalAuthenticator: prescription.PrescriptionLegalAuthenticator

  constructor(id: codes.GlobalIdentifier) {
    this.id = id
    this.code = new codes.SnomedCode("225426007")
    this.effectiveTime = core.Null.NOT_APPLICABLE
  }
}

/*
* A link to information concerning the progress of the dispense status of a prescription and
* reasons clarifying why a treatment could not be dispensed.
*/
// eslint-disable-next-line max-len
export class DispenseClaimSupplyHeaderPertinentInformation2 extends dispenseCommon.PertinentInformation2NonDispensingReason {}

export class DispenseClaimSupplyHeaderPertinentInformation1 implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
    typeCode: "PERT",
    contextConductionInd: "true",
    inversionInd: "false",
    negationInd: "false"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(false)
  templateId: codes.TemplateIdentifier = new codes.TemplateIdentifier("CSAB_RM-NPfITUK10.sourceOf2")
  pertinentSuppliedLineItem: DispenseClaimSuppliedLineItem

  constructor(suppliedLineItem: DispenseClaimSuppliedLineItem) {
    this.pertinentSuppliedLineItem = suppliedLineItem
  }
}

export class DispenseClaimSuppliedLineItem {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "SBADM",
    moodCode: "PRMS"
  }

  id: codes.GlobalIdentifier
  code: codes.SnomedCode
  effectiveTime: core.Null
  repeatNumber?: core.Interval<core.NumericValue>
  component: Array<DispenseClaimSuppliedLineItemComponent>
  pertinentInformation2: SuppliedLineItemPertinentInformation2
  pertinentInformation3: dispenseCommon.SuppliedLineItemPertinentInformation3
  inFulfillmentOf: dispenseCommon.SuppliedLineItemInFulfillmentOf

  constructor(id: codes.GlobalIdentifier) {
    this.id = id
    this.code = new codes.SnomedCode("225426007", "Administration of therapeutic substance (procedure)")
    this.effectiveTime = core.Null.NOT_APPLICABLE
  }
}
/**
 * An act relationship to provides reasons why a medication line item could not be dispensed.
 * This is mandatory if the prescription status is 'Not Dispensed'
 *
 *
 */
export class SuppliedLineItemPertinentInformation2 extends dispenseCommon.PertinentInformation2NonDispensingReason {}

export class DispenseClaimSuppliedLineItemComponent implements ElementCompact {
  _attributes: core.AttributeTypeCode = {
    typeCode: "COMP"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(false)
  suppliedLineItemQuantity: DispenseClaimSuppliedLineItemQuantity

  constructor(suppliedLineItemQuantity: DispenseClaimSuppliedLineItemQuantity) {
    this.suppliedLineItemQuantity = suppliedLineItemQuantity
  }
}

export class DispenseClaimSuppliedLineItemQuantity extends dispenseCommon.DispenseCommonSuppliedLineItemQuantity {
  pertinentInformation1: DispenseClaimSuppliedLineItemQuantityPertinentInformation1
  pertinentInformation2: Array<DispenseClaimSuppliedLineItemQuantityPertinentInformation2>

  constructor(
    quantity: core.QuantityInAlternativeUnits,
    product: dispenseCommon.DispenseProduct,
    pertinentInformation1: DispenseClaimSuppliedLineItemQuantityPertinentInformation1,
    pertinentInformation2: Array<DispenseClaimSuppliedLineItemQuantityPertinentInformation2>
  ) {
    super(quantity, product)
    this.pertinentInformation1 = pertinentInformation1
    this.pertinentInformation2 = pertinentInformation2
  }
}

export class DispenseClaimSuppliedLineItemQuantityPertinentInformation1 implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
    typeCode: "PERT",
    contextConductionInd: "true"
  }

  seperatableInd: core.BooleanValue = new core.BooleanValue(false)
  pertinentChargePayment: ChargePayment

  constructor(pertinentChargePayment: ChargePayment) {
    this.pertinentChargePayment = pertinentChargePayment
  }
}

export class ChargePayment extends prescription.PrescriptionAnnotation {
  value: core.BooleanValue

  constructor(value: boolean) {
    super(new codes.PrescriptionAnnotationCode("CP"))
    this.value = new core.BooleanValue(value)
  }
}

export class DispenseClaimSuppliedLineItemQuantityPertinentInformation2 implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
    typeCode: "PERT",
    contextConductionInd: "true"
  }

  seperatableInd: core.BooleanValue
  pertinentDispensingEndorsement: DispensingEndorsement

  constructor(pertinentDispensingEndorsement: DispensingEndorsement) {
    this.seperatableInd = new core.BooleanValue(true)
    this.pertinentDispensingEndorsement = pertinentDispensingEndorsement
  }
}

export class DispensingEndorsement extends prescription.PrescriptionAnnotation {
  text: string
  value: codes.DispensingEndorsementCode

  constructor() {
    super(new codes.PrescriptionAnnotationCode("DE"))
  }
}

export class Coverage implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
    typeCode: "COVBY",
    contextConductionInd: "true"
  }

  seperatableInd = new core.BooleanValue(false)
  coveringChargeExempt: ChargeExempt

  constructor(chargeExempt: ChargeExempt) {
    this.coveringChargeExempt = chargeExempt
  }
}

export class ChargeExempt extends prescription.PrescriptionAnnotation {
  value: codes.PrescriptionChargeExemptionCode
  authorization?: Authorization

  constructor(chargeExempt: boolean, value: string) {
    super(new codes.PrescriptionAnnotationCode("EX"), !chargeExempt)
    this.value = new codes.PrescriptionChargeExemptionCode(value)
  }
}

export class Authorization implements ElementCompact {
  _attributes: core.AttributeTypeCode & core.AttributeContextConductionInd = {
    typeCode: "AUTH",
    contextConductionInd: "true"
  }

  seperatableInd = new core.BooleanValue(false)
  authorizingEvidenceSeen: EvidenceSeen

  constructor(evidenceSeen: EvidenceSeen) {
    this.authorizingEvidenceSeen = evidenceSeen
  }
}

export class EvidenceSeen extends prescription.PrescriptionAnnotation {
  constructor(evidenceSeen: boolean) {
    super(new codes.PrescriptionAnnotationCode("ES"), !evidenceSeen)
  }
}

import {ElementCompact} from "xml-js"
import {AgentPerson} from "./agent-person"
import * as codes from "./codes"
import * as core from "./core"
import {
  DispenseCommonPertinentInformation1,
  DispenseProduct,
  PrimaryInformationRecipient,
  SequelTo,
  SuppliedLineItemComponent,
  SuppliedLineItemInFulfillmentOf,
  SuppliedLineItemPertinentInformation2,
  SuppliedLineItemPertinentInformation3,
  SupplyHeader
} from "./dispense-common"
import {PrescriptionAuthor} from "./prescription"
import {hl7V3} from "../index"

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
  pertinentInformation1: DispenseCommonPertinentInformation1<DispenseClaimSupplyHeader>
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

export class DispenseClaimSupplyHeader extends SupplyHeader<DispenseClaimSuppliedLineItem> {
  legalAuthenticator: LegalAuthenticator
}

export class DispenseClaimSuppliedLineItem implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "SBADM",
    moodCode: "PRMS"
  }

  id: codes.GlobalIdentifier
  code: codes.SnomedCode
  effectiveTime: core.Null
  repeatNumber?: core.Interval<core.NumericValue>
  component: Array<SuppliedLineItemComponent<DispenseClaimSuppliedLineItemQuantity>>
  pertinentInformation2: SuppliedLineItemPertinentInformation2
  pertinentInformation3: SuppliedLineItemPertinentInformation3
  inFulfillmentOf: SuppliedLineItemInFulfillmentOf

  constructor(id: codes.GlobalIdentifier) {
    this.id = id
    this.code = new hl7V3.SnomedCode("225426007")
    this.effectiveTime = core.Null.NOT_APPLICABLE
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
  pertinentInformation1: DispenseClaimSuppliedLineItemQuantityPertinentInformation1
  pertinentInformation2: Array<DispenseClaimSuppliedLineItemQuantityPertinentInformation2>

  constructor(
    quantity: core.QuantityInAlternativeUnits,
    product: DispenseProduct,
    pertinentInformation1: DispenseClaimSuppliedLineItemQuantityPertinentInformation1,
    pertinentInformation2: Array<DispenseClaimSuppliedLineItemQuantityPertinentInformation2>
  ) {
    this.code = new codes.SnomedCode("373784005")
    this.quantity = quantity
    this.product = product
    this.pertinentInformation1 = pertinentInformation1
    this.pertinentInformation2 = pertinentInformation2
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

export class DispenseClaimSuppliedLineItemQuantityPertinentInformation1 implements ElementCompact {
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

  code: codes.PrescriptionAnnotationCode
  value: boolean

  constructor(value: boolean) {
    this.code = new codes.PrescriptionAnnotationCode("CP")
    this.value = value
  }
}

export class DispensingEndorsement implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "OBS",
    moodCode: "EVN"
  }

  code: codes.PrescriptionAnnotationCode
  text: string
  value: codes.DispensingEndorsementCode

  constructor() {
    this.code = new codes.PrescriptionAnnotationCode("DE")
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

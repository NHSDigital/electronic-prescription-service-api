import * as codes from "./hl7-v3-datatypes-codes"
import {GlobalIdentifier, SdsUniqueIdentifier} from "./hl7-v3-datatypes-codes"
import {Attributes, ElementCompact} from "xml-js"
import {LosslessNumber} from "lossless-json"
import {getNumericValueAsString} from "../../services/translation/common"

export interface AttributeTypeCode extends Attributes {
  typeCode: "AUT" | "COMP" | "FLFS" | "LA" | "PART" | "PERT" | "PRD" | "PRF" | "RESP" | "RCT" | "SBJ"
}

export interface AttributeContextControlCode extends Attributes {
  contextControlCode: "OP"
}

export interface AttributeClassCode extends Attributes {
  classCode: "AGNT" | "CACT" | "CATEGORY" | "DEV" | "INFO" | "MANU" | "MMAT" | "OBS" | "ORG" | "PAT" | "PCPR" | "PROV"
    | "PSN" | "ROL" | "SBADM" | "SPLY"
}

export interface AttributeDeterminerCode extends Attributes {
  determinerCode: "INSTANCE" | "KIND"
}

export interface AttributeMoodCode extends Attributes {
  moodCode: "EVN" | "RQO"
}

type BooleanString = "true" | "false"

export interface AttributeContextConductionInd extends Attributes {
  contextConductionInd: BooleanString
}

export interface AttributeInversionInd extends Attributes {
  inversionInd: BooleanString
}

export interface AttributeNegationInd extends Attributes {
  negationInd: BooleanString
}

export class Text {
  _text: string

  constructor(text: string) {
    this._text = text
  }
}

export enum AddressUse {
  HOME = "H",
  PRIMARY_HOME = "HP",
  TEMPORARY = "TMP",
  POSTAL = "PST",
  WORK = "WP",
  BUSINESS = "BP"
}

export class Address implements ElementCompact {
  _attributes: {
    use?: AddressUse
  }
  streetAddressLine: Array<Text>
  postalCode: Text

  constructor(use?: AddressUse) {
    this._attributes = {
      use: use
    }
  }
}

export class BooleanValue implements ElementCompact {
  _attributes: {
    value: BooleanString
  }

  constructor(value: boolean) {
    this._attributes = {
      value: value ? "true" : "false"
    }
  }
}

export enum NameUse {
  USUAL = "L",
  ALIAS = "A",
  PREFERRED = "PREFERRED",
  PREVIOUS = "PREVIOUS",
  PREVIOUS_BIRTH = "PREVIOUS-BIRTH",
  PREVIOUS_MAIDEN = "PREVIOUS-MAIDEN",
  PREVIOUS_BACHELOR = "PREVIOUS-BACHELOR"
}

export class Name implements ElementCompact {
  _attributes: {
    use?: NameUse
  }

  family?: Text
  given?: Text | Array<Text>
  prefix?: Text | Array<Text>
  suffix?: Text | Array<Text>
}

enum NullFlavor {
  NOT_APPLICABLE = "NA"
}

export class Null implements ElementCompact {
  _attributes: {
    nullFlavor: NullFlavor
  }

  constructor(nullFlavor: NullFlavor) {
    this._attributes = {
      nullFlavor: nullFlavor
    }
  }

  static NOT_APPLICABLE = new Null(NullFlavor.NOT_APPLICABLE)
}

class QuantityTranslation implements ElementCompact {
  _attributes: {
    value: string,
    codeSystem: string,
    code: string,
    displayName: string
  }

  constructor(alternativeUnitValue: string, alternativeUnitCode: codes.SnomedCode) {
    this._attributes = {
      value: alternativeUnitValue,
      codeSystem: alternativeUnitCode._attributes.codeSystem,
      code: alternativeUnitCode._attributes.code,
      displayName: alternativeUnitCode._attributes.displayName
    }
  }
}

/**
 * This flavour of the physical quantity data type should be used where the quantity is converted into the approved UCUM
 * representation from an original recording in an alternative set of recognised units.
 * This flavour is used for representing medication dose form quantities recorded using the dm+d coded units of measure.
 */
export class QuantityInAlternativeUnits implements ElementCompact {
  _attributes: {
    value: string
    unit: string
  }

  translation: QuantityTranslation

  constructor(approvedUnitValue: string, alternativeUnitValue: string, alternativeUnitCode: codes.SnomedCode) {
    this._attributes = {
      value: approvedUnitValue,
      unit: "1"
    }

    this.translation = new QuantityTranslation(alternativeUnitValue, alternativeUnitCode)
  }
}

export enum TelecomUse {
  HOME = "H",
  PERMANENT_HOME = "HP",
  TEMPORARY = "HV",
  WORKPLACE = "WP",
  ANSWERING_MACHINE = "AS",
  MOBILE = "MC",
  PAGER = "PG",
  EMERGENCY_CONTACT = "EC"
}

export class Telecom implements ElementCompact {
  _attributes: {
    use: TelecomUse
    value: string
  }

  constructor(use: TelecomUse, value: string) {
    if (value) {
      value = value.replace(/\s/g, "")
      if (!value.startsWith("tel:")) {
        value = `tel:${value}`
      }
    }
    this._attributes = {
      use: use,
      value: value
    }
  }
}

export class Timestamp implements ElementCompact {
  _attributes: {
    value: string
  }

  constructor(value: string) {
    this._attributes = {
      value: value
    }
  }
}

export class NumericValue implements ElementCompact {
  _attributes: {
    value: string
  }

  constructor(value: string | LosslessNumber) {
    this._attributes = {
      value: getNumericValueAsString(value)
    }
  }
}

export class Interval<T> {
  low?: T
  high?: T

  constructor(low: T, high: T) {
    this.low = low
    this.high = high
  }
}

export class IntervalUnanchored {
  width: {
    _attributes: {
      value: string
      unit: string
    }
  }

  constructor(value: string, unit: string) {
    this.width = {
      _attributes: {
        value,
        unit
      }
    }
  }
}

export class SendMessagePayload<T> {
  id: GlobalIdentifier
  creationTime: Timestamp
  versionCode: codes.Hl7StandardVersionCode
  interactionId: codes.Hl7InteractionIdentifier
  processingCode: codes.ProcessingId
  processingModeCode: codes.ProcessingMode
  acceptAckCode: codes.AcceptAckCode
  communicationFunctionRcv: CommunicationFunction
  communicationFunctionSnd: CommunicationFunction
  ControlActEvent: ControlActEvent<T>

  constructor(id: GlobalIdentifier, creationTime: Timestamp, interactionId: codes.Hl7InteractionIdentifier) {
    this.id = id
    this.creationTime = creationTime
    this.versionCode = codes.Hl7StandardVersionCode.V3_NPFIT_4_2_00
    this.interactionId = interactionId
    this.processingCode = codes.ProcessingId.PRODUCTION
    this.processingModeCode = codes.ProcessingMode.ONLINE
    this.acceptAckCode = codes.AcceptAckCode.NEVER
  }
}

export class CommunicationFunction {
  device: Device

  constructor(device: Device) {
    this.device = device
  }
}

export class Device {
  _attributes: AttributeClassCode & AttributeDeterminerCode = {
    classCode: "DEV",
    determinerCode: "INSTANCE"
  }

  id: codes.AccreditedSystemIdentifier

  constructor(id: codes.AccreditedSystemIdentifier) {
    this.id = id
  }
}

export class ControlActEvent<T> {
  _attributes: AttributeClassCode & AttributeMoodCode = {
    classCode: "CACT",
    moodCode: "EVN"
  }

  author: SendMessagePayloadAuthorPersonSds
  author1: SendMessagePayloadAuthorSystemSds
  subject: T
}

abstract class SendMessagePayloadAuthor {
  _attributes: AttributeTypeCode = {
    typeCode: "AUT"
  }
}

export class SendMessagePayloadAuthorPersonSds extends SendMessagePayloadAuthor {
  AgentPersonSDS: AgentPersonSds

  constructor(agentPersonSds: AgentPersonSds) {
    super()
    this.AgentPersonSDS = agentPersonSds
  }
}

export class SendMessagePayloadAuthorSystemSds extends SendMessagePayloadAuthor {
  AgentSystemSDS: AgentSystemSds

  constructor(agentSystemSds: AgentSystemSds) {
    super()
    this.AgentSystemSDS = agentSystemSds
  }
}

abstract class SendMessagePayloadAgent {
  _attributes: AttributeClassCode = {
    classCode: "AGNT"
  }
}

export class AgentPersonSds extends SendMessagePayloadAgent {
  id: codes.SdsRoleProfileIdentifier
  agentPersonSDS: AgentPersonPersonSds
  part: AgentPersonPart
}

export class AgentPersonPersonSds {
  _attributes: AttributeClassCode & AttributeDeterminerCode = {
    classCode: "PSN",
    determinerCode: "INSTANCE"
  }

  id: SdsUniqueIdentifier

  constructor(id: SdsUniqueIdentifier) {
    this.id = id
  }
}

export class AgentPersonPart {
  _attributes: AttributeTypeCode = {
    typeCode: "PART"
  }

  partSDSRole: SdsRole

  constructor(sdsRole: SdsRole) {
    this.partSDSRole = sdsRole
  }
}

export class SdsRole {
  _attributes: AttributeClassCode = {
    classCode: "ROL"
  }

  id: codes.SdsJobRoleIdentifier

  constructor(id: codes.SdsJobRoleIdentifier) {
    this.id = id
  }
}

export class AgentSystemSds extends SendMessagePayloadAgent {
  agentSystemSDS: AgentSystemSystemSds

  constructor(systemSds: AgentSystemSystemSds) {
    super()
    this.agentSystemSDS = systemSds
  }
}

export class AgentSystemSystemSds {
  _attributes: AttributeClassCode & AttributeDeterminerCode = {
    classCode: "DEV",
    determinerCode: "INSTANCE"
  }

  id: codes.AccreditedSystemIdentifier

  constructor(id: codes.AccreditedSystemIdentifier) {
    this.id = id
  }
}

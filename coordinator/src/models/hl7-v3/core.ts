import * as codes from "./codes"
import {Attributes, ElementCompact} from "xml-js"
import {LosslessNumber} from "lossless-json"
import {getNumericValueAsString} from "../../services/translation/common"

export interface AttributeTypeCode extends Attributes {
  typeCode: "AUT" | "COMP" | "FLFS" | "LA" | "PART" | "PERT" | "PRCP" |"PRD" | "PRF" | "RESP" | "RCT" | "SBJ" | "SEQL"
}

export interface AttributeContextControlCode extends Attributes {
  contextControlCode: "ON" | "OP"
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

enum NullFlavor {
  NOT_APPLICABLE = "NA",
  UNKNOWN = "UNK"
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
  static UNKNOWN = new Null(NullFlavor.UNKNOWN)
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

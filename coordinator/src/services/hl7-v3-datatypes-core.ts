import * as codes from "./hl7-v3-datatypes-codes"
import {Attributes, ElementCompact} from "xml-js";

export interface AttributeTypeCode extends Attributes {
    typeCode: "AUT" | "COMP" | "FLFS" | "LA" | "PERT" | "PRD" | "PRF" | "RESP" | "RCT" | "SBJ"
}

export interface AttributeContextControlCode extends Attributes {
    contextControlCode: "OP"
}

export interface AttributeClassCode extends Attributes {
    classCode: "AGNT" | "CATEGORY" | "INFO" | "MANU" | "MMAT" | "OBS" | "ORG" | "PAT" | "PCPR" | "PROV" | "PSN" | "SBADM" | "SPLY"
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
    WORK = "WP"
}

export class Address implements ElementCompact {
    _attributes: {
        use: AddressUse
    }

    streetAddressLine: Array<Text>
    postalCode: Text

    constructor(use: AddressUse) {
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

export class Name implements ElementCompact {
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
 * This flavour of the physical quantity data type should be used where the quantity is converted into the approved UCUM representation from an original recording in an alternative set of recognised units.
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
    PERMANENT_HOME = "HP",
    TEMPORARY = "HV",
    WORKPLACE = "WP",
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

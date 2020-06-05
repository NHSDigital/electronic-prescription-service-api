import * as codes from "./hl7-v3-datatypes-codes"

export interface AttributeTypeCode {
    typeCode: string
}

export interface AttributeContextControlCode {
    contextControlCode: string
}

export interface AttributeClassCode {
    classCode: string
}

export interface AttributeDeterminerCode {
    determinerCode: string
}

export interface AttributeMoodCode {
    moodCode: string
}

export interface AttributeContextConductionInd {
    contextConductionInd: string
}

export interface AttributeInversionInd {
    inversionInd: string
}

export interface AttributeNegationInd {
    negationInd: string
}

export enum AddressUse {
    HOME = "H",
    PRIMARY_HOME = "HP",
    TEMPORARY = "TMP",
    POSTAL = "PST",
    WORK = "WP"
}

interface AddressAttributes {
    use: AddressUse
}

export class Address {
    _attributes: AddressAttributes
    streetAddressLine: Array<string>
    postalCode: string

    constructor(use: AddressUse, lines: Array<string>, postalCode: string) {
        this._attributes = {
            use: use
        }
        this.streetAddressLine = lines
        this.postalCode = postalCode
    }
}

enum BoolValue {
    TRUE = "true",
    FALSE = "false"
}

interface BoolAttributes {
    value: BoolValue
}

export class Bool {
    _attributes: BoolAttributes

    constructor(value: BoolValue) {
        this._attributes = {
            value: value
        }
    }

    static TRUE = new Bool(BoolValue.TRUE)
    static FALSE = new Bool(BoolValue.FALSE)
}

export class Name {
    family: string
    given: Array<string>
    prefix: Array<string>
    suffix: Array<string>

    constructor(family: string, given: Array<string>, prefix: Array<string>, suffix: Array<string>) {
        this.family = family
        this.given = given
        this.prefix = prefix
        this.suffix = suffix
    }
}

enum NullFlavor {
    NOT_APPLICABLE = "NA"
}

interface NullAttributes {
    nullFlavor: NullFlavor
}

export class Null {
    _attributes: NullAttributes

    constructor(nullFlavor: NullFlavor) {
        this._attributes = {
            nullFlavor: nullFlavor
        }
    }

    static NOT_APPLICABLE = new Null(NullFlavor.NOT_APPLICABLE)
}

class QuantityTranslation {
    value: string
    codeSystem: string
    code: string
    displayName: string

    constructor(alternativeUnitValue: string, alternativeUnitCode: codes.SnomedCode) {
        this.value = alternativeUnitValue
        this.codeSystem = alternativeUnitCode._attributes.codeSystem
        this.code = alternativeUnitCode._attributes.code
        this.displayName = alternativeUnitCode._attributes.displayName
    }
}

interface QuantityInAlternativeUnitsAttributes {
    value: string
    unit: string
}

export class QuantityInAlternativeUnits {
    _attributes: QuantityInAlternativeUnitsAttributes
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

interface TelecomAttributes {
    use: TelecomUse
    value: string
}

export class Telecom {
    _attributes: TelecomAttributes

    constructor(use: TelecomUse, value: string) {
        this._attributes = {
            use: use,
            value: value
        }
    }
}

interface TimestampAttributes {
    value: string
}

export class Timestamp {
    _attributes: TimestampAttributes

    constructor(value: string) {
        this._attributes = {
            value: value
        }
    }
}

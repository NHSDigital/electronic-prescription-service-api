function Address(use, lines, postalCode) {
  this._attributes = {use: use}
  this.streetAddressLine = lines
  this.postalCode = postalCode
}

Address.USE_HOME = "H"
Address.USE_PRIMARY_HOME = "HP"
Address.USE_TEMPORARY = "TMP"
Address.USE_POSTAL = "PST"
Address.USE_WORK = "WP"

function Bool(value) {
  this._attributes = {
    value: value
  }
}

Bool.TRUE = new Bool("true")
Bool.FALSE = new Bool("false")

function Name(family, given, prefix, suffix) {
  if (family) {
    this.family = family
  }
  if (given) {
    this.given = given
  }
  if (prefix) {
    this.prefix = prefix
  }
  if (suffix) {
    this.suffix = suffix
  }
}

function Null(flavor) {
  this._attributes = {
    nullFlavor: flavor
  }
}

Null.NOT_APPLICABLE = new Null("NA")

function QuantityInAlternativeUnits(approvedUnitValue, alternativeUnitValue, alternativeUnitCode) {
  this._attributes = {
    value: approvedUnitValue,
    unit: "1"
  }
  this.translation = {
    _attributes: {
      value: alternativeUnitValue,
      codeSystem: alternativeUnitCode._attributes.codeSystem,
      code: alternativeUnitCode._attributes.code,
      displayName: alternativeUnitCode._attributes.displayName
    }
  }
}

function Telecom(use, value) {
  this._attributes = {
    use: use,
    value: value
  }
}

Telecom.USE_PERMANENT_HOME = "HP"
Telecom.USE_TEMPORARY = "HV"
Telecom.USE_WORKPLACE = "WP"
Telecom.USE_MOBILE = "MC"
Telecom.USE_PAGER = "PG"
Telecom.USE_EMERGENCY_CONTACT = "EC"

function Timestamp(value) {
  this._attributes = {
    value: value
  }
}

module.exports = {
  Address: Address,
  Bool: Bool,
  Name: Name,
  Null: Null,
  QuantityInAlternativeUnits: QuantityInAlternativeUnits,
  Telecom: Telecom,
  Timestamp: Timestamp
}

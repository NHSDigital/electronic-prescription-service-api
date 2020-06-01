function Code(system, code, desc) {
  this._attributes = {
    codeSystem: system,
    code: code
  }
  if (desc) {
    this._attributes.displayName = desc
  }
}

Code.SexCode = function (code) {
  return new Code("2.16.840.1.113883.2.1.3.2.4.16.25", code)
}
Code.SexCode.UNKNOWN = new Code.SexCode("0")
Code.SexCode.MALE = new Code.SexCode("1")
Code.SexCode.FEMALE = new Code.SexCode("2")
Code.SexCode.INDETERMINATE = new Code.SexCode("9")

Code.PatientCareProvisionTypeCode = function (code) {
  return new Code("2.16.840.1.113883.2.1.3.2.4.17.37", code)
}

Code.SnomedCode = function (code, desc) {
  return new Code("2.16.840.1.113883.2.1.3.2.4.15", code, desc)
}

Code.SdsJobRoleCode = function (code) {
  return new Code("1.2.826.0.1285.0.2.1.104", code)
}

Code.OrganizationTypeCode = function (code) {
  return new Code("2.16.840.1.113883.2.1.3.2.4.17.94", code)
}

Code.PrescriptionAnnotationCode = function (code) {
  return new Code("2.16.840.1.113883.2.1.3.2.4.17.30", code)
}

Code.PrescriptionTreatmentTypeCode = function (code) {
  return new Code("2.16.840.1.113883.2.1.3.2.4.16.36", code)
}

Code.DispensingSitePreferenceCode = function (code) {
  return new Code("2.16.840.1.113883.2.1.3.2.4.17.21", code)
}

Code.PrescriptionTypeCode = function (code) {
  return new Code("2.16.840.1.113883.2.1.3.2.4.17.25", code)
}

function Identifier(root, extension) {
  this._attributes = {root: root}
  if (extension) {
    this._attributes.extension = extension
  }
}

Identifier.GlobalIdentifier = function (root) {
  return new Identifier(root)
}

Identifier.TypeIdentifier = function (extension) {
  return new Identifier("2.16.840.1.113883.2.1.3.2.4.18.7", extension)
}

Identifier.TemplateIdentifier = function (extension) {
  return new Identifier("2.16.840.1.113883.2.1.3.2.4.18.2", extension)
}

Identifier.NhsNumber = function (extension) {
  return new Identifier("2.16.840.1.113883.2.1.4.1", extension)
}

Identifier.SdsUniqueIdentifier = function (extension) {
  return new Identifier("1.2.826.0.1285.0.2.0.65", extension)
}

Identifier.SdsRoleProfileIdentifier = function (extension) {
  return new Identifier("1.2.826.0.1285.0.2.0.67", extension)
}

Identifier.ShortFormPrescriptionIdentifier = function (extension) {
  return new Identifier("2.16.840.1.113883.2.1.3.2.4.18.8", extension)
}

Identifier.SdsOrganizationIdentifier = function (extension) {
  return new Identifier("1.2.826.0.1285.0.1.10", extension)
}

module.exports = {
  Code: Code,
  Identifier: Identifier
}

const codes = require('./hl7-v3-datatypes-codes')
const Code = codes.Code

/**
 * Identifies or provides detailed information about a person fulfilling a specific role when it is not known whether all of the role profile, player and scoper details are available from SDS.
 */
function AgentPerson() {
  this._attributes = {
    classCode: "AGNT"
  }
}

/**
 * The provider responsible for the patient care provision, e.g. a GP with whom the patient is registered.
 */
function HealthCareProvider() {
  this._attributes = {classCode: "PROV"}
}

/**
 * Details of an organisation on SDS.
 */
function Organization() {
  this._attributes = {
    classCode: "ORG",
    determinerCode: "INSTANCE"
  }
}

Organization.prototype.setHealthCareProviderLicense = function (organization) {
  this.healthCareProviderLicense = {
    _attributes: {
      classCode: "PROV"
    },
    Organization: organization
  }
}

/**
 * Provides information about a patient's demographics and healthcare provision in a way that conforms to the PDS patient structure.
 */
function Patient() {
  this._attributes = {classCode: "PAT"}
}

/**
 * Act defining a relationship between a patient and his/her primary care provider.
 */
function PatientCareProvision(typeCode) {
  this._attributes = {
    classCode: "PCPR",
    moodCode: "EVN"
  }
  this.code = new Code.PatientCareProvisionTypeCode(typeCode)
}

PatientCareProvision.prototype.setHealthCareProvider = function (healthCareProvider) {
  this.responsibleParty = {
    _attributes: {typeCode: "RESP"},
    healthCareProvider: healthCareProvider
  }
}

PatientCareProvision.PrimaryCare = function () {
  return new PatientCareProvision("1")
}

/**
 * Details of the person who is the patient.
 */
function Person() {
  this._attributes = {
    classCode: "PSN",
    determinerCode: "INSTANCE"
  }
}

/**
 * A Role of a Person as a recipient of healthcare services from a healthcare provider.
 */
function ProviderPatient() {
  this._attributes = {
    classCode: "PAT"
  }
}

ProviderPatient.prototype.setSubjectOf = function (patientCareProvision) {
  this.subjectOf = {
    _attributes: {
      typeCode: "SBJ"
    },
    patientCareProvision: patientCareProvision
  }
}

module.exports = {
  AgentPerson: AgentPerson,
  HealthCareProvider: HealthCareProvider,
  Organization: Organization,
  Patient: Patient,
  PatientCareProvision: PatientCareProvision,
  Person: Person,
  ProviderPatient: ProviderPatient
}

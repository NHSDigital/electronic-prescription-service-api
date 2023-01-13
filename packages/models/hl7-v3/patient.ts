import {ElementCompact} from "xml-js"
import * as core from "./core"
import * as codes from "./codes"
import * as demographics from "./demographics"

/**
 * A link to the patient who has received the medication treatment.
 */
export class PatientReference implements ElementCompact {
  _attributes: core.AttributeClassCode = {
    classCode: "PAT"
  }

  id: codes.NhsNumber
}

/**
 * Provides information about a patient's demographics and healthcare provision in a way that conforms to the PDS
 * patient structure.
 */
export class Patient extends PatientReference {
  addr: Array<demographics.Address>
  telecom?: Array<demographics.Telecom>
  patientPerson: PatientPerson
}

/**
 * Details of the person who is the patient.
 */
export class PatientPerson implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeDeterminerCode = {
    classCode: "PSN",
    determinerCode: "INSTANCE"
  }

  name: Array<demographics.Name>
  administrativeGenderCode: codes.SexCode
  birthTime: core.Timestamp
  playedProviderPatient: ProviderPatient
}

/**
 * A Role of a Person as a recipient of healthcare services from a healthcare provider.
 */
export class ProviderPatient implements ElementCompact {
  _attributes: core.AttributeClassCode = {
    classCode: "PAT"
  }

  subjectOf: SubjectOf
}

/**
 * A link to the Patient who is the subject of the patient care provision.
 */
export class SubjectOf implements ElementCompact {
  _attributes: core.AttributeTypeCode = {
    typeCode: "SBJ"
  }

  patientCareProvision: PatientCareProvision

  constructor(patientCareProvision: PatientCareProvision) {
    this.patientCareProvision = patientCareProvision
  }
}

/**
 * Act defining a relationship between a patient and his/her primary care provider.
 */
export class PatientCareProvision implements ElementCompact {
  _attributes: core.AttributeClassCode & core.AttributeMoodCode = {
    classCode: "PCPR",
    moodCode: "EVN"
  }

  code: codes.PatientCareProvisionTypeCode
  responsibleParty: PatientResponsibleParty

  constructor(code: codes.PatientCareProvisionTypeCode) {
    this.code = code
  }
}

/**
 * A link to the professional who is directly responsible for the patient care provision.
 */
export class PatientResponsibleParty implements ElementCompact {
  _attributes: core.AttributeTypeCode = {
    typeCode: "RESP"
  }

  healthCareProvider: HealthCareProvider

  constructor(healthCareProvider: HealthCareProvider) {
    this.healthCareProvider = healthCareProvider
  }
}

/**
 * The provider responsible for the patient care provision, e.g. a GP with whom the patient is registered.
 */
export class HealthCareProvider implements ElementCompact {
  _attributes: core.AttributeClassCode = {
    classCode: "PROV"
  }

  id: codes.SdsOrganizationIdentifier | core.Null
}

/*
* A link to the patient who has received the medication treatment.
*/
export class RecordTargetReference implements ElementCompact {
  _attributes: core.AttributeTypeCode = {
    typeCode: "RCT"
  }

  patient: PatientReference

  constructor(patient: PatientReference) {
    this.patient = patient
  }
}

/**
 * A link between the ParentPrescription and the patient who receives the medication treatment.
 */
export class RecordTarget implements ElementCompact {
  _attributes: core.AttributeTypeCode = {
    typeCode: "RCT"
  }

  Patient: Patient

  constructor(patient: Patient) {
    this.Patient = patient
  }
}

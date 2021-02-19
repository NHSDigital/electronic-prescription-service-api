import {convertAddress, convertGender, convertName, convertTelecom} from "./demographics"
import {getIdentifierValueForSystem, onlyElement, UNKNOWN_GP_ODS_CODE} from "../common"
import {convertIsoDateStringToHl7V3Date} from "../common/dateTime"
import * as hl7V3 from "../../../models/hl7-v3"
import * as fhir from "../../../models/fhir"

function convertPatientToProviderPatient(
  patient: fhir.Patient
) {
  const generalPractitionerId = onlyElement(patient.generalPractitioner, "Patient.generalPractitioner")
  const hl7V3HealthCareProvider = new hl7V3.HealthCareProvider()
  const gpIdValue = generalPractitionerId.identifier.value
  hl7V3HealthCareProvider.id = gpIdValue === UNKNOWN_GP_ODS_CODE
    ? hl7V3.Null.UNKNOWN
    : new hl7V3.SdsOrganizationIdentifier(gpIdValue)
  const hl7V3PatientCareProvision = new hl7V3.PatientCareProvision(
    hl7V3.PatientCareProvisionTypeCode.PRIMARY_CARE
  )
  hl7V3PatientCareProvision.responsibleParty = new hl7V3.PatientResponsibleParty(hl7V3HealthCareProvider)
  const hl7V3ProviderPatient = new hl7V3.ProviderPatient()
  hl7V3ProviderPatient.subjectOf = new hl7V3.SubjectOf(hl7V3PatientCareProvision)
  return hl7V3ProviderPatient
}

function convertPatientToPatientPerson(
  bundle: fhir.Bundle,
  patient: fhir.Patient,
  convertNameFn = convertName,
  convertGenderFn = convertGender
) {
  const hl7V3PatientPerson = new hl7V3.PatientPerson()
  hl7V3PatientPerson.name = patient.name.map(name => convertNameFn(name, "Patient.name"))
  hl7V3PatientPerson.administrativeGenderCode = convertGenderFn(patient.gender, "Patient.gender")
  hl7V3PatientPerson.birthTime = convertIsoDateStringToHl7V3Date(patient.birthDate, "Patient.birthDate")
  hl7V3PatientPerson.playedProviderPatient = convertPatientToProviderPatient(patient)
  return hl7V3PatientPerson
}

export function convertPatient(
  bundle: fhir.Bundle,
  patient: fhir.Patient
): hl7V3.Patient {
  const hl7V3Patient = new hl7V3.Patient()
  const nhsNumber = getIdentifierValueForSystem(
    patient.identifier,
    "https://fhir.nhs.uk/Id/nhs-number",
    "Patient.identifier"
  )
  hl7V3Patient.id = new hl7V3.NhsNumber(nhsNumber)
  hl7V3Patient.addr = patient.address.map(address => convertAddress(address, "Patient.address"))
  if (patient.telecom) {
    hl7V3Patient.telecom = patient.telecom.map(tel => convertTelecom(tel, "Patient.telecom"))
  }
  hl7V3Patient.patientPerson = convertPatientToPatientPerson(bundle, patient)
  return hl7V3Patient
}

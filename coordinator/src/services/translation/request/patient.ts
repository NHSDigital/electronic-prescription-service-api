import * as fhir from "../../../models/fhir/fhir-resources"
import * as peoplePlaces from "../../../models/hl7-v3/hl7-v3-people-places"
import * as codes from "../../../models/hl7-v3/hl7-v3-datatypes-codes"
import * as core from "../../../models/hl7-v3/hl7-v3-datatypes-core"
import {convertAddress, convertGender, convertName, convertTelecom} from "./demographics"
import {getIdentifierValueForSystem, onlyElement, UNKNOWN_GP_ODS_CODE} from "../common"
import {convertIsoDateStringToHl7V3Date} from "../common/dateTime"

function convertPatientToProviderPatient(
  patient: fhir.Patient
) {
  const generalPractitionerId = onlyElement(patient.generalPractitioner, "Patient.generalPractitioner")
  const hl7V3HealthCareProvider = new peoplePlaces.HealthCareProvider()
  const gpIdValue = generalPractitionerId.identifier.value
  hl7V3HealthCareProvider.id = gpIdValue === UNKNOWN_GP_ODS_CODE
    ? core.Null.UNKNOWN
    : new codes.SdsOrganizationIdentifier(gpIdValue)
  const hl7V3PatientCareProvision = new peoplePlaces.PatientCareProvision(
    codes.PatientCareProvisionTypeCode.PRIMARY_CARE
  )
  hl7V3PatientCareProvision.responsibleParty = new peoplePlaces.ResponsibleParty(hl7V3HealthCareProvider)
  const hl7V3ProviderPatient = new peoplePlaces.ProviderPatient()
  hl7V3ProviderPatient.subjectOf = new peoplePlaces.SubjectOf(hl7V3PatientCareProvision)
  return hl7V3ProviderPatient
}

function convertPatientToPatientPerson(
  bundle: fhir.Bundle,
  patient: fhir.Patient,
  convertNameFn = convertName,
  convertGenderFn = convertGender
) {
  const hl7V3PatientPerson = new peoplePlaces.PatientPerson()
  hl7V3PatientPerson.name = patient.name.map(name => convertNameFn(name, "Patient.name"))
  hl7V3PatientPerson.administrativeGenderCode = convertGenderFn(patient.gender, "Patient.gender")
  hl7V3PatientPerson.birthTime = convertIsoDateStringToHl7V3Date(patient.birthDate, "Patient.birthDate")
  hl7V3PatientPerson.playedProviderPatient = convertPatientToProviderPatient(patient)
  return hl7V3PatientPerson
}

export function convertPatient(
  bundle: fhir.Bundle,
  patient: fhir.Patient
): peoplePlaces.Patient {
  const hl7V3Patient = new peoplePlaces.Patient()
  const nhsNumber = getIdentifierValueForSystem(
    patient.identifier,
    "https://fhir.nhs.uk/Id/nhs-number",
    "Patient.identifier"
  )
  hl7V3Patient.id = new codes.NhsNumber(nhsNumber)
  hl7V3Patient.addr = patient.address.map(address => convertAddress(address, "Patient.address"))
  if (patient.telecom) {
    hl7V3Patient.telecom = patient.telecom.map(tel => convertTelecom(tel, "Patient.telecom"))
  }
  hl7V3Patient.patientPerson = convertPatientToPatientPerson(bundle, patient)
  return hl7V3Patient
}

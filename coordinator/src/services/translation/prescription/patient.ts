import * as fhir from "../../../models/fhir/fhir-resources"
import * as peoplePlaces from "../../../models/hl7-v3/hl7-v3-people-places"
import * as codes from "../../../models/hl7-v3/hl7-v3-datatypes-codes"
import {convertAddress, convertGender, convertName} from "./demographics"
import {convertIsoStringToHl7V3Date, getIdentifierValueForSystem} from "../common"

function convertPatientToProviderPatient(
  patient: fhir.Patient
) {
  const managingOrganizationIdentifier = patient.managingOrganization.identifier.value
  const hl7V3HealthCareProvider = new peoplePlaces.HealthCareProvider()
  hl7V3HealthCareProvider.id = new codes.SdsOrganizationIdentifier(managingOrganizationIdentifier)
  const hl7V3PatientCareProvision = new peoplePlaces.PatientCareProvision(codes.PatientCareProvisionTypeCode.PRIMARY_CARE)
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
  hl7V3PatientPerson.birthTime = convertIsoStringToHl7V3Date(patient.birthDate, "Patient.birthDate")
  hl7V3PatientPerson.playedProviderPatient = convertPatientToProviderPatient(patient)
  return hl7V3PatientPerson
}

export function convertPatient(
  bundle: fhir.Bundle,
  patient: fhir.Patient,
  convertAddressFn = convertAddress
): peoplePlaces.Patient {
  const hl7V3Patient = new peoplePlaces.Patient()
  const nhsNumber = getIdentifierValueForSystem(
    patient.identifier,
    "https://fhir.nhs.uk/Id/nhs-number",
    "Patient.identifier"
  )
  hl7V3Patient.id = new codes.NhsNumber(nhsNumber)
  hl7V3Patient.addr = patient.address.map(address => convertAddressFn(address, "Patient.address"))
  hl7V3Patient.patientPerson = convertPatientToPatientPerson(bundle, patient)
  return hl7V3Patient
}

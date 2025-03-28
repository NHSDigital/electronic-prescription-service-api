import {
  convertAddress,
  convertGender,
  convertName,
  convertTelecom
} from "./demographics"
import {getIdentifierValueForSystem, onlyElement, UNKNOWN_GP_ODS_CODE} from "../common"
import {convertIsoDateStringToHl7V3Date} from "../common/dateTime"
import {fhir, hl7V3} from "@models"
import {Logger} from "pino"

function convertPatientToProviderPatient(patient: fhir.Patient, logger: Logger) {
  const hl7V3HealthCareProvider = new hl7V3.HealthCareProvider()
  if (patient.generalPractitioner && patient.generalPractitioner.length > 0) {
    const generalPractitionerId = onlyElement(patient.generalPractitioner, "Patient.generalPractitioner")
    const gpIdValue = generalPractitionerId.identifier.value
    if (gpIdValue === UNKNOWN_GP_ODS_CODE) {
      logger.warn("generalPractitioner passed in as V81999 - using unknown")
      hl7V3HealthCareProvider.id = hl7V3.Null.UNKNOWN
    } else {
      hl7V3HealthCareProvider.id = new hl7V3.SdsOrganizationIdentifier(gpIdValue)
    }
    hl7V3HealthCareProvider.id = gpIdValue === UNKNOWN_GP_ODS_CODE
      ? hl7V3.Null.UNKNOWN
      : new hl7V3.SdsOrganizationIdentifier(gpIdValue)
  } else {
    logger.warn("Missing generalPractitioner - replacing with unknown")
    hl7V3HealthCareProvider.id = hl7V3.Null.UNKNOWN
  }
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
  logger: Logger,
  convertNameFn = convertName,
  convertGenderFn = convertGender
) {
  const patientPerson = new hl7V3.PatientPerson()
  patientPerson.name = patient.name.map(name => convertNameFn(name, "Patient.name"))
  patientPerson.administrativeGenderCode = convertGenderFn(patient.gender, "Patient.gender")
  patientPerson.birthTime = convertIsoDateStringToHl7V3Date(patient.birthDate, "Patient.birthDate")
  patientPerson.playedProviderPatient = convertPatientToProviderPatient(patient, logger)
  return patientPerson
}

export function convertPatient(bundle: fhir.Bundle, fhirPatient: fhir.Patient, logger: Logger): hl7V3.Patient {
  const hl7V3Patient = new hl7V3.Patient()
  const nhsNumber = getIdentifierValueForSystem(
    fhirPatient.identifier,
    "https://fhir.nhs.uk/Id/nhs-number",
    "Patient.identifier"
  )
  hl7V3Patient.id = new hl7V3.NhsNumber(nhsNumber)
  hl7V3Patient.addr = fhirPatient.address.map(address => convertAddress(address, "Patient.address"))
  if (fhirPatient.telecom) {
    hl7V3Patient.telecom = fhirPatient.telecom.map(tel => convertTelecom(tel, "Patient.telecom"))
  }
  hl7V3Patient.patientPerson = convertPatientToPatientPerson(bundle, fhirPatient, logger)
  return hl7V3Patient
}

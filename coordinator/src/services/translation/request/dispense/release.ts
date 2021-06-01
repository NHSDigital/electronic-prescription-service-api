import {hl7V3, fhir} from "@models"
import * as uuid from "uuid"
import {getIdentifierParameterByName, getIdentifierParameterOrNullByName} from "../../common"
import {convertMomentToHl7V3DateTime} from "../../common/dateTime"
import moment from "moment"
import pino from "pino"
import {createAuthorForUnattendedAccess} from "../agent-unattended"

export async function translateReleaseRequest(
  fhirReleaseRequest: fhir.Parameters,
  logger: pino.Logger
): Promise<hl7V3.NominatedPrescriptionReleaseRequestWrapper | hl7V3.PatientPrescriptionReleaseRequestWrapper> {
  const organizationParameter = getIdentifierParameterByName(fhirReleaseRequest.parameter, "owner")
  const organizationCode = organizationParameter.valueIdentifier.value
  const prescriptionIdParameter = getIdentifierParameterOrNullByName(fhirReleaseRequest.parameter, "group-identifier")
  if (prescriptionIdParameter) {
    const prescriptionId = prescriptionIdParameter.valueIdentifier.value
    return createPatientReleaseRequest(organizationCode, prescriptionId, logger)
  } else {
    return await createNominatedReleaseRequest(organizationCode, logger)
  }
}

export async function createNominatedReleaseRequest(
  organizationCode: string,
  logger: pino.Logger
): Promise<hl7V3.NominatedPrescriptionReleaseRequestWrapper> {
  const hl7Id = new hl7V3.GlobalIdentifier(uuid.v4())
  const timestamp = convertMomentToHl7V3DateTime(moment.utc())
  const hl7Release = new hl7V3.NominatedPrescriptionReleaseRequest(hl7Id, timestamp)
  hl7Release.author = await createAuthorForUnattendedAccess(organizationCode, logger)
  return new hl7V3.NominatedPrescriptionReleaseRequestWrapper(hl7Release)
}

export async function createPatientReleaseRequest(
  organizationCode: string,
  prescriptionIdValue: string,
  logger: pino.Logger
): Promise<hl7V3.PatientPrescriptionReleaseRequestWrapper> {
  const hl7Id = new hl7V3.GlobalIdentifier(uuid.v4())
  const timestamp = convertMomentToHl7V3DateTime(moment.utc())
  const hl7Release = new hl7V3.PatientPrescriptionReleaseRequest(hl7Id, timestamp)
  hl7Release.author = await createAuthorForUnattendedAccess(organizationCode, logger)
  const prescriptionId = new hl7V3.PrescriptionId(prescriptionIdValue)
  hl7Release.pertinentInformation = new hl7V3.PatientPrescriptionReleaseRequestPertinentInformation(prescriptionId)
  return new hl7V3.PatientPrescriptionReleaseRequestWrapper(hl7Release)
}

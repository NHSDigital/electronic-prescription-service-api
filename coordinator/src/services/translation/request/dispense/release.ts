import {hl7V3, fhir} from "@models"
import * as uuid from "uuid"
import {
  getIdentifierParameterByName,
  getIdentifierParameterOrNullByName,
  getResourceParameterByName
} from "../../common"
import {convertMomentToHl7V3DateTime} from "../../common/dateTime"
import moment from "moment"
import pino from "pino"
import {createAuthorFromAuthenticatedUserDetails, createAuthorFromPractitionerRole} from "../agent-unattended"
import Hapi from "@hapi/hapi"
import {getUserName} from "../../../../utils/headers"

export async function translateReleaseRequest(
  fhirReleaseRequest: fhir.Parameters,
  headers: Hapi.Util.Dictionary<string>,
  logger: pino.Logger
): Promise<hl7V3.NominatedPrescriptionReleaseRequestWrapper | hl7V3.PatientPrescriptionReleaseRequestWrapper> {
  const organizationParameter = getIdentifierParameterByName(fhirReleaseRequest.parameter, "owner")
  const organizationCode = organizationParameter.valueIdentifier.value

  const prescriptionIdParameter = getIdentifierParameterOrNullByName(fhirReleaseRequest.parameter, "group-identifier")
  if (prescriptionIdParameter) {
    const prescriptionId = prescriptionIdParameter.valueIdentifier.value
    return await createPatientReleaseRequest(organizationCode, prescriptionId, headers, logger)
  } else {
    const agentParameter = getResourceParameterByName<fhir.PractitionerRole>(fhirReleaseRequest.parameter, "agent")
    return await createNominatedReleaseRequest(organizationCode, headers, agentParameter.resource, logger)
  }
}

export async function createNominatedReleaseRequest(
  organizationCode: string,
  headers: Hapi.Util.Dictionary<string>,
  practitionerRole: fhir.PractitionerRole,
  logger: pino.Logger
): Promise<hl7V3.NominatedPrescriptionReleaseRequestWrapper> {
  const hl7Id = new hl7V3.GlobalIdentifier(uuid.v4())
  const timestamp = convertMomentToHl7V3DateTime(moment.utc())
  const hl7Release = new hl7V3.NominatedPrescriptionReleaseRequest(hl7Id, timestamp)
  const practitionerRoleTelecom = practitionerRole.telecom[0].value

  if (isUserAuthenticated(headers)) {
    hl7Release.author = await createAuthorFromAuthenticatedUserDetails(
      organizationCode,
      headers,
      logger,
      practitionerRoleTelecom
    )
  } else {
    hl7Release.author = await createAuthorFromPractitionerRole(practitionerRole, logger)
  }
  return new hl7V3.NominatedPrescriptionReleaseRequestWrapper(hl7Release)
}

function isUserAuthenticated(headers: Hapi.Util.Dictionary<string>) {
  return !!getUserName(headers)
}

export async function createPatientReleaseRequest(
  organizationCode: string,
  prescriptionIdValue: string,
  headers: Hapi.Util.Dictionary<string>,
  logger: pino.Logger
): Promise<hl7V3.PatientPrescriptionReleaseRequestWrapper> {
  const hl7Id = new hl7V3.GlobalIdentifier(uuid.v4())
  const timestamp = convertMomentToHl7V3DateTime(moment.utc())
  const hl7Release = new hl7V3.PatientPrescriptionReleaseRequest(hl7Id, timestamp)
  hl7Release.author = await createAuthorFromAuthenticatedUserDetails(organizationCode, headers, logger)
  const prescriptionId = new hl7V3.PrescriptionId(prescriptionIdValue)
  hl7Release.pertinentInformation = new hl7V3.PatientPrescriptionReleaseRequestPertinentInformation(prescriptionId)
  return new hl7V3.PatientPrescriptionReleaseRequestWrapper(hl7Release)
}

import * as hl7v3 from "../../../../models/hl7-v3"
import * as uuid from "uuid"
import {fhir} from "@models"
import {getIdentifierParameterByName} from "../../common"
import {convertMomentToHl7V3DateTime} from "../../common/dateTime"
import moment from "moment"
import pino from "pino"
import {createAuthorForUnattendedAccess} from "../agent-unattended"

export async function translateReleaseRequest(
  fhirReleaseRequest: fhir.Parameters,
  logger: pino.Logger
): Promise<hl7v3.NominatedPrescriptionReleaseRequestWrapper> {
  const organizationParameter = getIdentifierParameterByName(fhirReleaseRequest.parameter, "owner")
  const organizationCode = organizationParameter.valueIdentifier.value

  const hl7Id = new hl7v3.GlobalIdentifier(uuid.v4())
  const timestamp = convertMomentToHl7V3DateTime(moment.utc())
  const hl7Release = new hl7v3.NominatedPrescriptionReleaseRequest(hl7Id, timestamp)
  hl7Release.author = await createAuthorForUnattendedAccess(organizationCode, logger)
  return new hl7v3.NominatedPrescriptionReleaseRequestWrapper(hl7Release)
}

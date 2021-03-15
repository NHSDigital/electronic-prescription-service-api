import * as fhir from "../../../models/fhir"
import {getIdentifierValueForSystem} from "../common"
import * as hl7V3 from "../../../models/hl7-v3"
import * as pino from "pino"
import {createAuthorForUnattendedAccess} from "./agent-unattended"

export function createIdFromTaskIdentifier(identifier: Array<fhir.Identifier>): hl7V3.GlobalIdentifier {
  const idValue = getIdentifierValueForSystem(
    identifier,
    "https://tools.ietf.org/html/rfc4122",
    "Task.identifier"
  )
  return new hl7V3.GlobalIdentifier(idValue)
}

export async function createAuthorFromTaskOwnerIdentifier(
  identifier: fhir.Identifier,
  logger: pino.Logger
): Promise<hl7V3.SendMessagePayloadAuthorAgentPerson> {
  const odsOrganizationCode = getIdentifierValueForSystem(
    [identifier],
    "https://fhir.nhs.uk/Id/ods-organization-code",
    "Task.owner.identifier"
  )
  return await createAuthorForUnattendedAccess(odsOrganizationCode, logger)
}

export function getPrescriptionShortFormIdFromTaskGroupIdentifier(groupIdentifier: fhir.Identifier): string {
  return getIdentifierValueForSystem(
    [groupIdentifier],
    "https://fhir.nhs.uk/Id/prescription-order-number",
    "Task.groupIdentifier"
  )
}

export function getMessageIdFromTaskFocusIdentifier(identifier: fhir.Identifier): string {
  return getIdentifierValueForSystem(
    [identifier],
    "https://tools.ietf.org/html/rfc4122",
    "Task.focus.identifier"
  )
}

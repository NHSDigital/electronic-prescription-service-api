import {fhir} from "@models"
import {getIdentifierValueForSystem} from "../common"
import * as hl7V3 from "../../../models/hl7-v3"
import * as pino from "pino"
import {createAuthorForUnattendedAccess} from "./agent-unattended"

export async function createAuthorFromTaskOwnerIdentifier(
  identifier: fhir.Identifier,
  logger: pino.Logger
): Promise<hl7V3.Author> {
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

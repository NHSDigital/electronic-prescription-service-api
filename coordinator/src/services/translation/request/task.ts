import {fhir, hl7V3} from "@models"
import {getIdentifierValueForSystem} from "../common"
import * as pino from "pino"
import {createAuthorFromAuthenticatedUserDetails} from "./agent-unattended"
import Hapi from "@hapi/hapi"

export async function createAuthorFromTaskOwnerIdentifier(
  identifier: fhir.Identifier,
  headers: Hapi.Util.Dictionary<string>,
  logger: pino.Logger
): Promise<hl7V3.Author> {
  const odsOrganizationCode = getIdentifierValueForSystem(
    [identifier],
    "https://fhir.nhs.uk/Id/ods-organization-code",
    "Task.owner.identifier"
  )

  return await createAuthorFromAuthenticatedUserDetails(odsOrganizationCode, headers, logger)
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

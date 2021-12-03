import {fhir, hl7V3} from "@models"
import {getExtensionForUrl, getIdentifierValueForSystem} from "../common"
import * as pino from "pino"
import {createAuthorForAttendedAccess} from "./agent-unattended"

export async function createAuthorFromProvenanceAgentExtension(
  task: fhir.Task,
  logger: pino.Logger
): Promise<hl7V3.Author> {
  const authorExtension = getExtensionForUrl(
    task.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-Provenance-agent",
    "Task.extension"
  ) as fhir.IdentifierReferenceExtension<fhir.Practitioner | fhir.PractitionerRole>
  const sdsId = authorExtension.valueReference.identifier.value
  const odsOrganizationCode = getIdentifierValueForSystem(
    [task.owner.identifier],
    "https://fhir.nhs.uk/Id/ods-organization-code",
    "Task.owner.identifier"
  )
  return await createAuthorForAttendedAccess(sdsId, odsOrganizationCode, logger)
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

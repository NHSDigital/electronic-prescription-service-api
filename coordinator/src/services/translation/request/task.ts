import {fhir} from "@models"
import {getIdentifierValueForSystem} from "../common"

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
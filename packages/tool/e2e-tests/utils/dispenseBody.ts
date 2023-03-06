import * as uuid from "uuid"
import * as templateBody from "./templateBodies/templateDispenseBody.json"

export function createDispenseBody(prescriptionId: string, lineItemIds: string[]): string {
  const body = {...templateBody.templateBody}

  body.identifier.value = uuid.v4()

  if (
    !body.entry[1].resource.contained ||
    !body.entry[2].resource.contained ||
    !body.entry[1].resource.contained[1].groupIdentifier ||
    !body.entry[2].resource.contained[1].groupIdentifier
  ) {
    throw new Error("Error encountered when modifying template dispense body")
  }

  body.entry[1].resource.contained[1].identifier[0].value = lineItemIds[0]
  body.entry[2].resource.contained[1].identifier[0].value = lineItemIds[1]

  body.entry[1].resource.contained[1].groupIdentifier.value = prescriptionId
  body.entry[2].resource.contained[1].groupIdentifier.value = prescriptionId

  return JSON.stringify(body)
}

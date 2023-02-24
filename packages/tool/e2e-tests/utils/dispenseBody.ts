import * as uuid from "uuid"

export function createDispenseBody(prescriptionId: string, lineItemIds: string[]): string{
  console.log(prescriptionId, lineItemIds)

  let body = require("./templateBodies/templateDispenseBody.json")
  body.identifier.value = uuid.v4()

  body.entry[1].contained[1].identifier.value = lineItemIds[0];
  body.entry[2].contained[1].identifier.value = lineItemIds[1];

  body.entry[1].contained[1].groupIdentifier.value = prescriptionId;
  body.entry[2].contained[1].groupIdentifier.value = prescriptionId;

  return JSON.stringify(body);
}

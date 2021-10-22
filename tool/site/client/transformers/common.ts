import * as fhir from "../models"
import * as uuid from "uuid"

export function createUuidIdentifier(): fhir.Identifier {
  return {
    system: "https://tools.ietf.org/html/rfc4122",
    value: uuid.v4()
  }
}

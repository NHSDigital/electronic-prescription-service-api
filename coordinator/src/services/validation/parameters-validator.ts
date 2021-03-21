import * as fhir from "@models/fhir"
import {createResourceTypeIssue} from "../../models/errors/validation-errors"

export function verifyParameters(parameters: fhir.Parameters): Array<fhir.OperationOutcomeIssue> {
  if (parameters.resourceType !== "Parameters") {
    return [createResourceTypeIssue("Parameters")]
  }
  return []
}

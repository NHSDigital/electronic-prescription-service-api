import * as common from "./common"

export interface OperationOutcome extends common.Resource {
  resourceType: "OperationOutcome"
  issue: Array<OperationOutcomeIssue>
}

export interface OperationOutcomeIssue {
  severity: "information" | "warning" | "error" | "fatal"
  code: "informational" | "value" | "invalid"
  details?: common.CodeableConcept
  diagnostics?: string
  expression?: Array<string>
}

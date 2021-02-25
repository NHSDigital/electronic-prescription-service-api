import * as common from "./common"

export interface OperationOutcome extends common.Resource {
  resourceType: "OperationOutcome"
  issue: Array<OperationOutcomeIssue>
}

export function createOperationOutcome(issues: Array<OperationOutcomeIssue>): OperationOutcome {
  return {
    resourceType: "OperationOutcome",
    issue: issues
  }
}

export interface OperationOutcomeIssue {
  severity: "information" | "warning" | "error" | "fatal"
  code: "informational" | "value" | "invalid"
  details?: common.CodeableConcept
  diagnostics?: string
  expression?: Array<string>
}

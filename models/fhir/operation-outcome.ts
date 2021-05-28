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

export enum IssueCodes {
  INFORMATIONAL = "informational",
  VALUE = "value",
  INVALID = "invalid",
  FORBIDDEN = "forbidden",
  BUSINESS_RULE = "business-rule",
  DUPLICATE = "duplicate",
  STRUCTURE = "structure",
  CODE_INVALID = "code-invalid",
  CONFLICT = "conflict",
  NOT_FOUND = "not-found",
  EXCEPTION = "exception",
  PROCESSING = "processing",
  NOT_SUPPORTED = "not-supported"
}

export interface OperationOutcomeIssue {
  severity: "information" | "warning" | "error" | "fatal"
  code: IssueCodes
  details?: common.CodeableConcept
  diagnostics?: string
  expression?: Array<string>
}

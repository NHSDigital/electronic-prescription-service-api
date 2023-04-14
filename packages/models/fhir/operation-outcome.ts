import * as common from "./common"

export interface OperationOutcome extends common.Resource {
  resourceType: "OperationOutcome"
  issue: Array<OperationOutcomeIssue>
}

export function createOperationOutcome(issues: Array<OperationOutcomeIssue>, lastUpdated?: string): OperationOutcome {
  return {
    resourceType: "OperationOutcome",
    meta: {
      lastUpdated: lastUpdated
    },
    issue: issues
  }
}

export function createOperationOutcomeIssue(
  code: IssueCodes, severity: IssueSeverity, codeableConcept: common.CodeableConcept
): OperationOutcomeIssue {
  return {
    code,
    severity,
    details: codeableConcept
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
  severity: IssueSeverity
  code: IssueCodes
  details?: common.CodeableConcept
  diagnostics?: string
  expression?: Array<string>
}

export type IssueSeverity = "information" | "warning" | "error" | "fatal"

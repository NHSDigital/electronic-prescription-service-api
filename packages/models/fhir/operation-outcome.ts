import * as common from "./common"
import moment from "moment"

export interface OperationOutcome extends common.Resource {
  resourceType: "OperationOutcome"
  issue: Array<OperationOutcomeIssue>
}

export function createOperationOutcome(issues: Array<OperationOutcomeIssue>): OperationOutcome {
  return {
    resourceType: "OperationOutcome",
    meta: {
      "lastUpdated": convertMomentToISODateTime(moment.utc())
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

const ISO_DATE_TIME_FORMAT = "YYYY-MM-DD[T]HH:mm:ssZ"
export function convertMomentToISODateTime(moment: moment.Moment): string {
  return moment.format(ISO_DATE_TIME_FORMAT)
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

import {fhir} from "@models"

export function getStatusCode(issues: Array<fhir.OperationOutcomeIssue>): number {
  if (issues.every(i => i.code === fhir.IssueCodes.INFORMATIONAL)) {
    return 200
  }
  if (issues.every(i => i.code === fhir.IssueCodes.FORBIDDEN)) {
    return 403
  }
  return 400
}

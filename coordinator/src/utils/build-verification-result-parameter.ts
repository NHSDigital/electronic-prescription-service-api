import {fhir} from "@models"

export function buildVerificationResultParameter(
  bundle: fhir.Bundle,
  issue: Array<fhir.OperationOutcomeIssue>,
  index: number
): fhir.MultiPartParameter {
  const messageIdentifierParameter: fhir.ReferenceParameter<fhir.Bundle> = {
    name: "messageIdentifier",
    valueReference: {
      identifier: bundle.identifier
    }
  }

  const resourceParameter: fhir.ResourceParameter<fhir.OperationOutcome> = {
    name: "result",
    resource: {
      resourceType: "OperationOutcome",
      issue: issue
    }
  }

  return {
    name: index.toString(),
    part: [
      messageIdentifierParameter,
      resourceParameter
    ]
  }
}

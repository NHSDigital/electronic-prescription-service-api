import Hapi from "@hapi/hapi"
import {BASE_PATH, ContentTypes, externalValidator, getPayload} from "../util"
import {fhir} from "@models"
import {isBundle} from "../../utils/type-guards"
import {convertParentPrescription} from "../../services/translation/request/prescribe/parent-prescription"
import {
  verifyPrescriptionSignatureValid,
  verifySignatureMatchesPrescription
} from "../../services/signature-verification"
import pino from "pino"

export default [
  /*
      Verify prescription bundle signatures.
    */
  {
    method: "POST",
    path: `${BASE_PATH}/$verify-signature`,
    handler: externalValidator(
      async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) => {
        const outerBundle = getPayload(request) as fhir.Resource
        if (isBundle(outerBundle)) {
          request.logger.info("Verifying prescription signatures from Bundle")
          const verificationResponses = outerBundle.entry
            .map(entry => entry.resource)
            .filter(isBundle)
            .map((innerBundle, index) => verifyPrescriptionSignature(innerBundle, index, request.logger))

          const parameters: fhir.Parameters = {
            resourceType: "Parameters",
            parameter: verificationResponses
          }

          return responseToolkit.response(parameters).code(200).type(ContentTypes.FHIR)
        }
      }
    )
  }
]

function verifyPrescriptionSignature(
  bundle: fhir.Bundle,
  index: number,
  logger: pino.Logger
): fhir.MultiPartParameter {
  const parentPrescription = convertParentPrescription(bundle, logger)
  const validSignature = verifyPrescriptionSignatureValid(parentPrescription)
  const matchingSignature = verifySignatureMatchesPrescription(parentPrescription)

  if (validSignature && matchingSignature) {
    const issue: Array<fhir.OperationOutcomeIssue> = [{
      severity: "information",
      code: fhir.IssueCodes.INFORMATIONAL
    }]
    return buildVerificationResultParameter(bundle, issue, index)
  } else {
    const issue: Array<fhir.OperationOutcomeIssue> = []
    if (!validSignature) {
      issue.push({
        severity: "error",
        code: fhir.IssueCodes.INVALID,
        details: {
          coding: [{
            system: "TODO_ASK_KEVIN",
            code: "SIGNATURE_INVALID",
            display: "Signature is invalid."
          }]
        }
      })
    }
    if (!matchingSignature) {
      issue.push({
        severity: "error",
        code: fhir.IssueCodes.INVALID,
        details: {
          coding: [{
            system: "TODO_ASK_KEVIN",
            code: "SIGNATURE_DOES_NOT_MATCH_PRESCRIPTION",
            display: "Signature doesn't match prescription."
          }]
        }
      })
    }
    return buildVerificationResultParameter(bundle, issue, index)
  }
}

function buildVerificationResultParameter(
  bundleEntryResource: fhir.Bundle,
  issue: Array<fhir.OperationOutcomeIssue>,
  index: number
): fhir.MultiPartParameter {
  const valueReference: fhir.ReferenceParameter<fhir.Bundle> = {
    name: "messageIdentifier",
    valueReference: {
      identifier: bundleEntryResource.identifier
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
    part: [valueReference, resourceParameter]
  }
}

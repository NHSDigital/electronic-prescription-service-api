import Hapi from "@hapi/hapi"
import {BASE_PATH, ContentTypes, externalValidator, getPayload} from "../util"
import {fhir, validationErrors as errors} from "@models"
import {isBundle} from "../../utils/type-guards"
import {convertParentPrescription} from "../../services/translation/request/prescribe/parent-prescription"
import {
  verifyPrescriptionSignatureValid, verifySignatureHasCorrectFormat,
  verifySignatureDigestMatchesPrescription
} from "../../services/signature-verification"
import pino from "pino"
import {buildVerificationResultParameter} from "../../utils/build-verification-result-parameter"

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
        if (!isBundle(outerBundle)) {
          const operationOutcome = fhir.createOperationOutcome([
            errors.createResourceTypeIssue("Bundle")
          ])
          return responseToolkit.response(operationOutcome).code(400).type(ContentTypes.FHIR)
        }

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
    )
  }
]

function verifyPrescriptionSignature(
  bundle: fhir.Bundle,
  index: number,
  logger: pino.Logger
): fhir.MultiPartParameter {
  const parentPrescription = convertParentPrescription(bundle, logger)
  const validSignatureFormat = verifySignatureHasCorrectFormat(parentPrescription)
  if (!validSignatureFormat) {
    const issue: Array<fhir.OperationOutcomeIssue> = [
      createInvalidSignatureIssue("Invalid signature format.")
    ]
    return buildVerificationResultParameter(bundle, issue, index)
  }

  const validSignature = verifyPrescriptionSignatureValid(parentPrescription)
  const matchingSignature = verifySignatureDigestMatchesPrescription(parentPrescription)
  if (validSignature && matchingSignature) {
    const issue: Array<fhir.OperationOutcomeIssue> = [{
      severity: "information",
      code: fhir.IssueCodes.INFORMATIONAL
    }]
    return buildVerificationResultParameter(bundle, issue, index)
  } else {
    const issue: Array<fhir.OperationOutcomeIssue> = []
    if (!validSignature) {
      issue.push(createInvalidSignatureIssue("Signature is invalid."))
    }
    if (!matchingSignature) {
      issue.push(createInvalidSignatureIssue("Signature doesn't match prescription."))
    }
    return buildVerificationResultParameter(bundle, issue, index)
  }
}

function createInvalidSignatureIssue(display: string): fhir.OperationOutcomeIssue {
  return {
    severity: "error",
    code: fhir.IssueCodes.INVALID,
    details: {
      coding: [{
        system: "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode",
        code: "INVALID",
        display
      }]
    },
    expression: ["Provenance.signature.data"]
  }
}

import Hapi from "@hapi/hapi"
import {BASE_PATH, ContentTypes, externalValidator, getPayload, handleResponse} from ".././util"
import {fhir, hl7V3} from "@models"
import * as bundleValidator from "../../services/validation/bundle-validator"
import {isBundle} from "../../utils/type-guards";
import * as translator from "../../services/translation/request";
import {convertParentPrescription} from "../../services/translation/request/prescribe/parent-prescription";
import {
  verifyPrescriptionSignatureValid,
  verifySignatureMatchesPrescription
} from "../../services/signature-verification";
import {ElementCompact} from "xml-js";
import pino from "pino";

function formVerifySignatureResponse(bundleEntryResource: fhir.Bundle, issue: { severity: string; code: string }[], index: number) {
  const valueReference = {
    name: "messageIdentifier",
    valueReference: {
      identifier: bundleEntryResource.identifier
    }
  }


  const resourceParameter = {
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

function getSignatureVerification(bundleEntryResource: fhir.Bundle, index: number, logger: pino.Logger): fhir.MultiPartParameter {
  const parentPrescription = convertParentPrescription(bundleEntryResource, logger)
  const parentPrescriptionRoot =  new hl7V3.ParentPrescriptionRoot(parentPrescription)
  const validSignature = verifyPrescriptionSignatureValid(parentPrescriptionRoot)
  const matchingSignature = verifySignatureMatchesPrescription(parentPrescriptionRoot)

  if (validSignature && matchingSignature) {
    const issue = [{"severity": "information", "code": "informational"}]
    return formVerifySignatureResponse(bundleEntryResource, issue, index)
  } else {
    const issue: Array<fhir.OperationOutcomeIssue> = []
    if (!validSignature) {
      issue.push({
        "severity": "error",
        "code": fhir.IssueCodes.INVALID,
        "details": {
          "coding": [{
            "system": "",
            "code": "",
            "display": "Signature is invalid.",
          }]
        }
      })
    }
    if (!matchingSignature) {
      issue.push({
        "severity": "error",
        "code": fhir.IssueCodes.INVALID,
        "details": {
          "coding": [{
            "system": "",
            "code": "",
            "display": "Signature doesn't match prescription.",
          }]
        }
      })
    }
    return formVerifySignatureResponse(bundleEntryResource, issue, index)
  }
}

export default [
  /*
      Verify prescription bundle signatures.
    */
  {
    method: "POST",
    path: `${BASE_PATH}/$verify-signature`,
    handler: externalValidator(
      async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) => {
        const bundle = getPayload(request) as fhir.Resource
        if (isBundle(bundle)) {

          request.logger.info("Building HL7V3 message from Bundle")
          const verificationResponses = bundle.entry
            .map(entry => entry.resource)
            .filter(isBundle)
            .map((bundle, index) => getSignatureVerification(bundle, index, request.logger))

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

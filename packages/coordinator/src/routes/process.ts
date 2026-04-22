import * as translator from "../services/translation/request"
import {spineClient} from "../services/communication/spine-client"
import Hapi, {RouteDefMethods} from "@hapi/hapi"
import {
  BASE_PATH,
  ContentTypes,
  externalValidator,
  getPayload,
  handleResponse,
  handlerWrapper
} from "./util"
import {createHash} from "./create-hash"
import {fhir, spine} from "@models"
import * as bundleValidator from "../services/validation/bundle-validator"
import {
  getAsid,
  getScope,
  getSdsRoleProfileId,
  getSdsUserUniqueId
} from "../utils/headers"
import {getStatusCode} from "../utils/status-code"
import {HashingAlgorithm} from "../services/translation/common/hashingAlgorithm"
import {isSignatureValidationEnabled} from "../utils/feature-flags"
import {identifyMessageType} from "../services/translation/common"
import {verifyPrescriptionSignature} from "../services/verification/signature-verification"

const createCreationSignatureIssue = (diagnostics: string): fhir.OperationOutcomeIssue => ({
  severity: "error",
  code: fhir.IssueCodes.INVALID,
  diagnostics
})

export default [
  /*
      Send a signed message on to SPINE.
    */
  {
    method: "POST" as RouteDefMethods,
    path: `${BASE_PATH}/$process-message`,
    handler: handlerWrapper(async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) => {
      const bundle = await getPayload(request) as fhir.Bundle
      request.log("audit", {incomingMessageHash: createHash(JSON.stringify(bundle), HashingAlgorithm.SHA256)})

      const scope = getScope(request.headers)
      const accessTokenSDSUserID = getSdsUserUniqueId(request.headers)
      const accessTokenSDSRoleID = getSdsRoleProfileId(request.headers)

      const issues = bundleValidator.verifyBundle(
        bundle,
        scope,
        accessTokenSDSUserID,
        accessTokenSDSRoleID,
        request.logger
      )
      if (issues.length) {
        const response = fhir.createOperationOutcome(issues, bundle.meta?.lastUpdated)
        const statusCode = getStatusCode(issues)
        return responseToolkit.response(response).code(statusCode).type(ContentTypes.FHIR)
      }

      request.logger.info("Building Spine request")

      let spineRequest: spine.SpineRequest
      if (identifyMessageType(bundle) === fhir.EventCodingCode.PRESCRIPTION) {
        const result = await translator.convertPrescriptionBundleToSpineRequest(
          bundle, request.headers, request.logger
        )

        if (isSignatureValidationEnabled()) {
          try {
            const errors = await verifyPrescriptionSignature(
              result.parentPrescription, request.logger
            )
            if (errors.length) {
              const prescriptionId = result.parentPrescription.id._attributes.root.toLowerCase()
              request.logger.error(
                `[Verifying signature for prescription ${prescriptionId} on creation]: ${errors.join(", ")}`
              )
              const signatureIssues = errors.map(createCreationSignatureIssue)
              const response = fhir.createOperationOutcome(signatureIssues, bundle.meta?.lastUpdated)
              return responseToolkit.response(response).code(400).type(ContentTypes.FHIR)
            }
          } catch (e) {
            request.logger.error(e, "Uncaught error during signature verification for creation")
            const signatureIssues = [createCreationSignatureIssue("Uncaught error during signature verification")]
            const response = fhir.createOperationOutcome(signatureIssues, bundle.meta?.lastUpdated)
            return responseToolkit.response(response).code(400).type(ContentTypes.FHIR)
          }
        }

        spineRequest = result.spineRequest
      } else {
        spineRequest = await translator.convertBundleToSpineRequest(bundle, request.headers, request.logger)
      }

      const spineResponse = await spineClient.send(spineRequest, getAsid(request.headers), request.logger)
      return await handleResponse(request, spineResponse, responseToolkit)
    }, [externalValidator])
  }
]

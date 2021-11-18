import * as Hapi from "@hapi/hapi"
import {
  BASE_PATH,
  ContentTypes,
  externalValidator,
  getPayload,
  handleResponse
} from "../util"
import {fhir} from "@models"
import * as translator from "../../services/translation/request"
import * as claimValidator from "../../services/validation/claim-validator"
import {spineClient} from "../../services/communication/spine-client"
import {getScope} from "../../utils/headers"
import {getStatusCode} from "../../utils/status-code"

export default [
  /*
    Send a claim to SPINE
  */
  {
    method: "POST",
    path: `${BASE_PATH}/Claim`,
    handler: externalValidator(
      async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) => {
        const claimPayload = getPayload(request) as fhir.Claim
        const scope = getScope(request.headers)
        const accessTokenOrg = "ODS_CODE"
        const issues = claimValidator.verifyClaim(claimPayload, scope, accessTokenOrg)
        if (issues.length) {
          const response = fhir.createOperationOutcome(issues)
          const statusCode = getStatusCode(issues)
          return responseToolkit.response(response).code(statusCode).type(ContentTypes.FHIR)
        }

        request.logger.info("Building Spine claim request")
        const spineRequest = await translator.convertClaimToSpineRequest(claimPayload, request.headers, request.logger)
        const spineResponse = await spineClient.send(spineRequest, request.logger)
        return handleResponse(request, spineResponse, responseToolkit)
      }
    )
  }
]

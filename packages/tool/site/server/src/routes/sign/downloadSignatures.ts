import Hapi, {RouteDefMethods} from "@hapi/hapi"
import {getApigeeAccessTokenFromSession, getSessionValue, setSessionValue} from "../../services/session"
import {
  getPrBranchUrl,
  parseOAuthState,
  prRedirectEnabled,
  prRedirectRequired
} from "../helpers"
import {isDev} from "../../services/environment"
import {CONFIG} from "../../config"
import * as fhir from "fhir/r4"
import {getSigningClient} from "../../services/communication/signing-client"
import {getSessionPrescriptionIdsArray} from "../util"

export default [
  {
    method: "POST" as RouteDefMethods,
    path: "/sign/download-signatures",
    options: {
      auth: false
    },
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const parsedRequest = request.payload as {signatureToken: string, state?: string}

      if (isDev(CONFIG.environment) && parsedRequest.state) {
        const state = parseOAuthState(parsedRequest.state as string, request.logger)
        if (prRedirectRequired(state.prNumber)) {
          if (prRedirectEnabled()) {
            const queryString = `token=${parsedRequest.signatureToken}`
            return responseToolkit.response({
              redirectUri: getPrBranchUrl(state.prNumber, "prescribe/send", queryString)
            }).code(200)
          } else {
            return responseToolkit.response({}).code(400)
          }
        }
      }

      const signatureToken = parsedRequest.signatureToken

      if (!signatureToken) {
        return responseToolkit.response({error: "No signature token was provided"}).code(400)
      }

      const existingSignatureResult = getSessionValue(`signature_${signatureToken}`, request)

      if (!existingSignatureResult) {
        const accessToken = getApigeeAccessTokenFromSession(request)
        const signingClient = getSigningClient(request, accessToken)
        const signatureResponse = await signingClient.makeSignatureDownloadRequest(signatureToken)

        if (!signatureResponse) {
          return responseToolkit.response({error: "Failed to download signature"}).code(400)
        }

        setSessionValue(`signature_${signatureToken}`, signatureResponse, request)
      }

      const prescriptionIds = getSessionPrescriptionIdsArray(request)
      const prepares: Array<{prescriptionId: string, request: fhir.Bundle}> = prescriptionIds.map((id: string) => {
        return {
          prescriptionId: id,
          request: getSessionValue(`prepare_request_${id}`, request)
        }
      })

      const results = prepares.map(prepare => {
        return {
          bundle_id: prepare.request.id,
          prescription_id: prepare.prescriptionId,
          success: "unknown"
        }
      })

      return responseToolkit.response({results}).code(200)
    }
  }
]

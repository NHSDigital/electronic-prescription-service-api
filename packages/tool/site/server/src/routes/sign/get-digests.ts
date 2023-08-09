import Hapi from "@hapi/hapi"
import {CONFIG} from "../../config"
import {getEpsClient} from "../../services/communication/eps-client"
import {getApigeeAccessTokenFromSession, getSessionValue, setSessionValue} from "../../services/session"
import * as fhir from "fhir/r4"
import {getSessionPrescriptionIdsArray} from "../util"
import jwt from "jsonwebtoken"

export default [
  {
    method: "GET",
    path: "/sign/get-digests",
    handler: async (request: Hapi.Request): Promise<string> => {
      const accessToken = getApigeeAccessTokenFromSession(request)
      const epsClient = getEpsClient(accessToken, request)
      const prescriptionIds = getSessionPrescriptionIdsArray(request)
      const prepareResponses = []
      for (const id of prescriptionIds) {
        const prepareRequest = getSessionValue(`prepare_request_${id}`, request)
        const prepareResponse = await epsClient.makePrepareRequest(prepareRequest)
        setSessionValue(`prepare_response_${id}`, prepareResponse, request)
        if (!prepareResponseIsError(prepareResponse)) {
          prepareResponses.push({
            id: id,
            response: prepareResponse
          })
        }
      }
      const payload = {
        payloads: prepareResponses.map(pr => {
          return {
            id: pr.id,
            payload: pr.response.parameter?.find(p => p.name === "digest")?.valueString
          }
        }),
        algorithm: prepareResponses[0].response.parameter?.find(p => p.name === "algorithm")?.valueString
      }

      return jwt.sign(payload, getPrivateKey(CONFIG.apigeeAppJWTPrivateKey), {
        algorithm: "RS512",
        keyid: CONFIG.apigeeAppJWTKeyId,
        issuer: CONFIG.apigeeAppClientId,
        subject: CONFIG.subject,
        audience: `${CONFIG.publicApigeeHost}/signing-service`,
        expiresIn: 600
      })
    }
  }
]

function getPrivateKey(private_key_secret: string) {
  while (private_key_secret.length % 4 !== 0) {
    private_key_secret += "="
  }
  return Buffer.from(private_key_secret, "base64").toString("utf-8")
}

function prepareResponseIsError(prepareResponse: fhir.Parameters | fhir.OperationOutcome): prepareResponse is fhir.OperationOutcome {
  return !!(prepareResponse as fhir.OperationOutcome).issue?.length
}

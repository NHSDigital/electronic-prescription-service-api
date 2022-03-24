import Hapi from "@hapi/hapi"
import {getSigningClient} from "../../services/communication/signing-client"
import {appendToSessionValue, getSessionValue, setSessionValue} from "../../services/session"
import {getEpsClient} from "../../services/communication/eps-client"
import {getPrBranchUrl, parseOAuthState, prRedirectEnabled, prRedirectRequired} from "../helpers"
import {isDev} from "../../services/environment"
import {CONFIG} from "../../config"
import * as fhir from "fhir/r4"

export default [
  {
    method: "POST",
    path: "/prescribe/send",
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

      const existingSendResult = getSessionValue(`signature_token_${signatureToken}`, request)
      if (existingSendResult) {
        return responseToolkit.response(existingSendResult).code(200)
      }
      const accessToken = getSessionValue("access_token", request)
      const signingClient = getSigningClient(request, accessToken)
      const signatureResponse = await signingClient.makeSignatureDownloadRequest(signatureToken)

      if (!signatureResponse) {
        return responseToolkit.response({error: "Failed to download signature"}).code(400)
      }

      const prescriptionIds = getSessionValue("prescription_ids", request)
      const prepareResponses: {prescriptionId: string, response: fhir.Parameters}[] = prescriptionIds.map((id: string) => {
        return {
          prescriptionId: id,
          response: getSessionValue(`prepare_response_${id}`, request)
        }
      })

      const failedPreparePrescriptionIds = prepareResponses.filter(r => prepareResponseIsError(r.response)).map(r => r.prescriptionId)
      const successfulPrepareResponses = prepareResponses.filter(r => failedPreparePrescriptionIds.includes(r.prescriptionId))
      for (const [index, prepareResponse] of successfulPrepareResponses.entries()) {
        const payload = prepareResponse.response.parameter?.find(p => p.name === "digest")?.valueString ?? ""
        const signature = signatureResponse.signatures[index].signature
        const certificate = signatureResponse.certificate
        const payloadDecoded = Buffer.from(payload, "base64")
          .toString("utf-8")
          .replace('<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">', "<SignedInfo>")
        const xmlDsig =
          `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
            ${payloadDecoded}
            <SignatureValue>${signature}</SignatureValue>
            <KeyInfo><X509Data><X509Certificate>${certificate}</X509Certificate></X509Data></KeyInfo>
          </Signature>`
        const xmlDsigEncoded = Buffer.from(xmlDsig, "utf-8").toString("base64")
        const provenance = createProvenance(prepareResponse.response.parameter?.find(p => p.name === "timestamp")?.valueString ?? "", xmlDsigEncoded)
        const prepareRequest = getSessionValue(`prepare_request_${prepareResponse.prescriptionId}`, request)
        prepareRequest.entry.push(provenance)
        const sendRequest = prepareRequest
        setSessionValue(`prescription_order_send_request_${prepareResponse.prescriptionId}`, sendRequest, request)
      }

      const epsClient = getEpsClient(accessToken, request)
      if (prescriptionIds.length === 1) {
        const sendRequest = getSessionValue(`prescription_order_send_request_${prescriptionIds[0]}`, request)
        const sendResponse = await epsClient.makeSendRequest(sendRequest)
        const sendRequestHl7 = await epsClient.makeConvertRequest(sendRequest)
        const sendResult = {
          prescription_ids: prescriptionIds,
          prescription_id: prescriptionIds[0],
          success: sendResponse.statusCode === 200,
          request_xml: sendRequestHl7,
          request: sendRequest,
          response: sendResponse.fhirResponse,
          response_xml: sendResponse.spineResponse
        }
        setSessionValue(`signature_token_${signatureToken}`, sendResult, request)
        appendToSessionValue("sent_prescription_ids", prescriptionIds, request)
        return responseToolkit.response(sendResult).code(200)
      }

      const results = []
      for (const id of prescriptionIds) {
        let sendResponseStatus = 0
        let bundleId: string | undefined = ""
        if (failedPreparePrescriptionIds.includes(id)) {
          bundleId = (getSessionValue(`prepare_request_${id}`, request) as fhir.Bundle).id
          sendResponseStatus = 400
        } else {
          const sendRequest = getSessionValue(`prescription_order_send_request_${id}`, request)
          bundleId = (sendRequest as fhir.Bundle).id
          sendResponseStatus = (await epsClient.makeSendRequest(sendRequest)).statusCode
        }
        results.push({
          prescription_id: id,
          bundle_id: bundleId,
          success: sendResponseStatus === 200
        })
      }
      const sendBulkResult = {results}
      setSessionValue(`signature_token_${signatureToken}`, sendBulkResult, request)
      appendToSessionValue("sent_prescription_ids", prescriptionIds, request)
      return responseToolkit.response(sendBulkResult).code(200)
    }
  }
]

function createProvenance(timestamp: string, signature: string) {
  return {
    "fullUrl": "urn:uuid:28828c55-8fa7-42d7-916f-fcf076e0c10e",
    "resource": {
      "resourceType": "Provenance",
      "id": "28828c55-8fa7-42d7-916f-fcf076e0c10e",
      "target": [
        {
          "reference": "urn:uuid:a54219b8-f741-4c47-b662-e4f8dfa49ab6"
        }
      ],
      "recorded": "2021-02-11T16:35:38+00:00",
      "agent": [
        {
          "who": {
            "reference": "urn:uuid:56166769-c1c4-4d07-afa8-132b5dfca666"
          }
        }
      ],
      "signature": [
        {
          "type": [
            {
              "system": "urn:iso-astm:E1762-95:2013",
              "code": "1.2.840.10065.1.12.1.1"
            }
          ],
          "when": timestamp,
          "who": {
            "reference": "urn:uuid:56166769-c1c4-4d07-afa8-132b5dfca666"
          },
          "data": signature
        }
      ]
    }
  }
}

function prepareResponseIsError(prepareResponse: fhir.Parameters | fhir.OperationOutcome)
: prepareResponse is fhir.OperationOutcome {
  return !!(prepareResponse as fhir.OperationOutcome).issue?.length
}

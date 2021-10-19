import Hapi from "@hapi/hapi"
import {getSigningClient} from "../../services/communication/signing-client"
import {getSessionValue, getSessionValueOrDefault, setSessionValue} from "../../services/session"
import {getEpsClient} from "../../services/communication/eps-client"

export default [
  {
    method: "GET",
    path: "/prescribe/send",
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const accessToken = getSessionValueOrDefault("access_token", request, "")
      const authMethod = getSessionValueOrDefault("auth_method", request, "cis2")
      const signatureToken = request.query["token"]
      const signingClient = getSigningClient(request, accessToken, authMethod)
      const signatureResponse = await signingClient.makeSignatureDownloadRequest(signatureToken)
      const prescriptionIds = getSessionValue("prescription_ids", request)
      const prepareResponses = prescriptionIds.map((id: string) => {
        return {
          prescriptionId: id,
          response: getSessionValue(`prepare_response_${id}`, request)
        }
      })
      prepareResponses.forEach((prepareResponse: { prescriptionId: string, response: any }, index: number) => {
        const payload = prepareResponse.response.digest
        const signature = signatureResponse.signatures[index].signature
        const certificate = signatureResponse.certificate
        const payloadDecoded = Buffer.from(payload, "base64")
          .toString("utf-8")
          .replace('<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">', "<SignedInfo>")
        const xmlDsig =
          `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">${payloadDecoded}'
            f"<SignatureValue>${signature}</SignatureValue>"
            f"<KeyInfo><X509Data><X509Certificate>${certificate}</X509Certificate></X509Data></KeyInfo>"
            f"</Signature>`
        const xmlDsigEncoded = Buffer.from(xmlDsig, "utf-8").toString("base64")
        const provenance = createProvenance(prepareResponse.response.timestamp, xmlDsigEncoded)
        const prepareRequest = getSessionValue(`prepare_request_${prepareResponse.prescriptionId}`, request)
        prepareRequest.entry.push(provenance)
        const sendRequest = prepareRequest
        setSessionValue(`prescription_order_send_request_${prepareResponse.prescriptionId}`, sendRequest, request)
      })
      return responseToolkit.response({}).code(200)
    }
  },
  {
    method: "POST",
    path: "/prescribe/send",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const prescriptionIds = getSessionValue("prescription_ids", request)
      const accessToken = getSessionValueOrDefault("access_token", request, "")
      const epsClient = getEpsClient(accessToken)
      if (prescriptionIds.length === 1) {
        const sendRequest = getSessionValue(`prescription_order_send_request_${prescriptionIds[0]}`, request)
        const sendResponse = await epsClient.makeSendRequest(sendRequest)
        const convertResponse = await epsClient.makeConvertRequest(sendRequest)
        return h.response({
          prescription_ids: prescriptionIds,
          prescription_id: prescriptionIds[0],
          success: true,
          request_xml: convertResponse,
          request: sendRequest,
          response: sendResponse,
          response_xml: ""
        }).code(200)
      }

      return h.response({
        prescription_ids: prescriptionIds,
        success_list: prescriptionIds.map((id: string) => {
          return {
            prescription_id: id,
            success: true
          }
        })
      }).code(200)
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

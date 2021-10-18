import Hapi from "@hapi/hapi"
import {getSessionValue, setSessionValue} from "../../services/session"

export default [
  {
    method: "GET",
    path: "/prescribe/send",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const signatureResponse = downloadSignatureRequest(request)
      const prescriptionIds = getSessionValue("prescription_ids", request)
      const prepareResponses = prescriptionIds.map((id: string) => {
        return {
          prescriptionId: id,
          response: getSessionValue(`prepare_response_${id}`, request)
        }
      })
      prepareResponses.forEach((prepareResponse: {prescriptionId: string, response: any}, index: number) => {
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
      return h.response({}).code(200)
    }
  },
  {
    method: "POST",
    path: "/prescribe/send",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      // const accessToken = getSessionValue("access_token", request)
      const prescriptionIds = getSessionValue("prescription_ids", request)
      if (prescriptionIds.length === 1) {
        const send_request = getSessionValue(`prescription_order_send_request_${prescriptionIds[0]}`, request)
        return h.response({
          prescription_ids: prescriptionIds,
          prescription_id: prescriptionIds[0],
          success: true,
          request_xml: "",
          request: send_request,
          response: {},
          response_xml: ""
        }).code(200)
      }
      return h.response({}).code(200)
    }
  }
]

function downloadSignatureRequest(request: Hapi.Request): {signatures: {id: string, signature: string}[], certificate: string} {
  const useMockSignatureResponse = process.env.ENVIRONMENT?.endsWith("-sandbox")
  if (useMockSignatureResponse) {
    return getMockSignatureDownloadResponse(request)
  }

  return getSignatureDownloadRequest(request)
}

function getMockSignatureDownloadResponse(request: Hapi.Request) {
  const mockCertificate = ""
  const mockSignatures = getSessionValue("prescription_ids", request).map((id: string) => {
    return {
      id,
      signature: ""
    }
  })
  return {
    signatures: mockSignatures,
    certificate: mockCertificate
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getSignatureDownloadRequest(request: Hapi.Request): { signatures: { id: string; signature: string} []; certificate: string } {
  // todo: live implementation

  // const authMethod = getSessionValue("auth_method", request) ?? "simulated"
  // const accessToken = getSessionValue("access_token", request)
  // const signatureToken = request.query["token"]
  // const prescriptionId = getSessionValue("prescription_id", request)

  //   signing_base_url = get_signing_base_path(auth_method, False)
  // #     return httpx.get(
  // #         f"{signing_base_url}/signatureresponse/{token}",
  // #         headers={"Content-Type": "text/plain", "Authorization": f"Bearer {access_token}"},
  // #         verify=False,
  // #     ).json()

  return {
    signatures: [],
    certificate: ""
  }
}

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

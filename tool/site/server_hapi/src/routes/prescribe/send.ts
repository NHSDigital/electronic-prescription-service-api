import Hapi from "@hapi/hapi"

export default [
  {
    method: "GET",
    path: "/prescribe/send",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      // const authMethod = request.yar.get("auth_method") ?? "simulated"
      // const accessToken = request.yar.get("access_token")
      // const signatureToken = request.query["token"]
      const signatureResponse = downloadSignatureRequest(request)
      // const prescriptionId = request.yar.get("prescription_id")
      const prescriptionIds = request.yar.get("prescription_ids")
      const prepareResponses = prescriptionIds.map((id: string) => {
        return {
          prescriptionId: id,
          response: request.yar.get(`prepare_response_${id}`)
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
        const prepareRequest = request.yar.get(`prepare_request_${prepareResponse.prescriptionId}`)
        prepareRequest.entry.push(provenance)
        const sendRequest = prepareRequest
        request.yar.set(`prescription_order_send_request_${prepareResponse.prescriptionId}`, sendRequest)
      })
      return h.response({}).code(200)
    }
  },
  {
    method: "POST",
    path: "/prescribe/send",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      // const accessToken = request.yar.get("access_token")
      const prescriptionIds = request.yar.get("prescription_ids")
      if (prescriptionIds.length === 1) {
        const send_request = request.yar.get(`prescription_order_send_request_${prescriptionIds[0]}`)
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
    const mockCertificate = ""
    const mockSignatures =
        request.yar.get("prescription_ids").map((id: string) => {
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
  else {
    // todo: non-mocked implementation
    return {
      signatures: [],
      certificate: ""
    }
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

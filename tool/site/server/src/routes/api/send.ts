import Hapi from "@hapi/hapi"
import {appendToSessionValue, getSessionValue, setSessionValue} from "../../services/session"
import {getEpsClient} from "../../services/communication/eps-client"
import * as fhir from "fhir/r4"

export default [
  {
    method: "POST",
    path: "/api/prescribe/send",
    options: {
      auth: false
    },
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const parsedRequest = request.payload as {signatureToken: string, results: Array<{prescription_id: string}>}
      const signatureToken = parsedRequest.signatureToken
      const signatureResponse = getSessionValue(`signature_${signatureToken}`, request)

      const prescriptionIds = parsedRequest.results.map(r => r.prescription_id)
      const prepares: {prescriptionId: string, request: fhir.Bundle, response: fhir.Parameters | fhir.OperationOutcome}[] = prescriptionIds.map((id: string) => {
        return {
          prescriptionId: id,
          request: getSessionValue(`prepare_request_${id}`, request),
          response: getSessionValue(`prepare_response_${id}`, request)
        }
      })

      const accessToken = getSessionValue("access_token", request)
      const epsClient = getEpsClient(accessToken, request)
      const results = []

      for (const prepare of prepares) {
        if (prepareResponseIsError(prepare.response)) {
          const bundleId = (prepare.request as fhir.Bundle).id
          results.push({
            bundle_id: bundleId,
            prescription_id: prepare.prescriptionId,
            prepareResponseError: JSON.stringify(prepare.response),
            success: false
          })
          continue
        }

        const payload = prepare.response.parameter?.find(p => p.name === "digest")?.valueString ?? ""
        const signature = signatureResponse.signatures.find((sig: any) => sig.id === prepare.prescriptionId).signature
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
        const provenance = createProvenance(prepare.response.parameter?.find(p => p.name === "timestamp")?.valueString ?? "", xmlDsigEncoded)

        prepare.request.entry?.push(provenance)

        const sendRequest = prepare.request
        const sendResponse = await epsClient.makeSendRequest(sendRequest)

        results.push({
          bundle_id: sendRequest.id,
          prescription_id: prepare.prescriptionId,
          response: JSON.stringify(sendResponse),
          success: sendResponse.statusCode === 200
        })

        setSessionValue(`prescription_order_send_request_${prepare.prescriptionId}`, sendRequest, request)
      }

      const sendBulkResult = {results}
      // setSessionValue(`signature_token_${signatureToken}`, sendBulkResult, request)
      appendToSessionValue("sent_prescription_ids", prescriptionIds, request)
      // clearSessionValue("prescription_ids", request)
      // clearSessionValue("prescription_id", request)
      // setSessionValue("exception-report", results.filter(r => r.prepareResponseError), request)
      return responseToolkit.response(sendBulkResult).code(200)
    }
  }
]

function createProvenance(timestamp: string, signature: string) : fhir.BundleEntry {
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

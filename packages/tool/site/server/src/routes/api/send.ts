import Hapi, {RouteDefMethods} from "@hapi/hapi"
import {
  appendToSessionValue,
  getApigeeAccessTokenFromSession,
  getSessionValue,
  setSessionValue
} from "../../services/session"
import {getEpsClient} from "../../services/communication/eps-client"
import * as fhir from "fhir/r4"
import {SignatureDownloadResponse} from "../../services/communication/signing-client"
import {getMedicationRequests} from "../../common/getResources"
import {getCorrelationId} from "../util"

interface SuccessfulPrepareData {
  prescriptionId: string
  request: fhir.Bundle
  response: fhir.Parameters
}

function generateProvenance(prepare: SuccessfulPrepareData, signatureResponse: SignatureDownloadResponse) {
  const payload = prepare.response.parameter?.find(p => p.name === "digest")?.valueString ?? ""
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const signature = signatureResponse.signatures.find((sig: any) => sig.id === prepare.prescriptionId)?.signature
  const certificate = signatureResponse.certificate

  const payloadDecoded = Buffer.from(payload, "base64")
    .toString("utf-8")
    .replace("<SignedInfo xmlns=\"http://www.w3.org/2000/09/xmldsig#\">", "<SignedInfo>")
  const xmlDsig =
    `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
            ${payloadDecoded}
            <SignatureValue>${signature}</SignatureValue>
            <KeyInfo><X509Data><X509Certificate>${certificate}</X509Certificate></X509Data></KeyInfo>
          </Signature>`
  const xmlDsigEncoded = Buffer.from(xmlDsig, "utf-8").toString("base64")

  const timestamp = prepare.response.parameter?.find(p => p.name === "timestamp")?.valueString ?? ""
  const medicationRequests = getMedicationRequests(prepare.request)
  const requesterReference = medicationRequests[0].requester?.reference ?? ""

  return createProvenance(timestamp, requesterReference, xmlDsigEncoded)
}

export default [
  {
    method: "POST" as RouteDefMethods,
    path: "/api/prescribe/send",
    options: {
      auth: false
    },
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const parsedRequest = request.payload as {signatureToken: string, results: Array<{prescription_id: string}>}
      const signatureToken = parsedRequest.signatureToken
      const signatureResponse = getSessionValue(`signature_${signatureToken}`, request) as SignatureDownloadResponse

      const prescriptionIds = parsedRequest.results.map(r => r.prescription_id)
      const prepares = prescriptionIds.map((id: string) => {
        return {
          prescriptionId: id,
          request: getSessionValue(`prepare_request_${id}`, request),
          response: getSessionValue(`prepare_response_${id}`, request)
        }
      })

      const accessToken = getApigeeAccessTokenFromSession(request)
      const epsClient = getEpsClient(accessToken, request)
      const correlationId = getCorrelationId(request)
      const results = []

      for (const prepare of prepares) {
        if (prepareResponseIsError(prepare.response)) {
          const bundleId = (prepare.request as fhir.Bundle).id
          results.push({
            bundle_id: bundleId,
            prescription_id: prepare.prescriptionId,
            prepareResponseError: prepare.response,
            success: false
          })
          continue
        }

        const provenance = generateProvenance(prepare, signatureResponse)

        prepare.request.entry?.push(provenance)

        const sendRequest = prepare.request

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let sendRequestHl7: any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let sendResponse: any
        if (prepares.length === 1) {
          sendResponse = await epsClient.makeSendRequest(sendRequest, correlationId)
          sendRequestHl7 = await epsClient.makeConvertRequest(sendRequest, correlationId)
        } else {
          sendResponse = await epsClient.makeSendFhirRequest(sendRequest, correlationId)
        }

        results.push({
          bundle_id: sendRequest.id,
          prescription_id: prepare.prescriptionId,
          request: sendRequest,
          request_xml: sendRequestHl7,
          response: sendResponse.fhirResponse,
          response_xml: sendResponse.spineResponse,
          success: sendResponse.statusCode === 200
        })

        setSessionValue(`prescription_order_send_request_${prepare.prescriptionId}`, sendRequest, request)
      }

      const sendBulkResult = {results}
      const prepareFailures = results.filter(r => r.prepareResponseError).map(r => {
        return {
          Test: r.bundle_id,
          Prescription: r.prescription_id,
          Request: JSON.stringify(prepares.find(p => p.prescriptionId === r.prescription_id)?.request),
          Error: JSON.stringify(r.prepareResponseError)
        }
      })
      appendToSessionValue("sent_prescription_ids", prescriptionIds, request)
      appendToSessionValue("exception_report", prepareFailures, request)
      return responseToolkit.response(sendBulkResult).code(200)
    }
  }
]

function createProvenance(timestamp: string, requesterReference: string, signature: string) : fhir.BundleEntry {
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
            "reference": requesterReference
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
            "reference": requesterReference
          },
          "data": signature
        }
      ]
    }
  }
}

function prepareResponseIsOperationOutcome(
  prepareResponse: fhir.Parameters | fhir.OperationOutcome
): prepareResponse is fhir.OperationOutcome {
  return prepareResponse.resourceType === "OperationOutcome"
}

function prepareResponseIsError(
  prepareResponse: fhir.Parameters | fhir.OperationOutcome
): prepareResponse is fhir.OperationOutcome {
  if (!prepareResponseIsOperationOutcome(prepareResponse)) {
    return false
  }
  return !!prepareResponse.issue?.length
}

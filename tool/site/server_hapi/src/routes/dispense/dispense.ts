import Hapi from "@hapi/hapi"
import {getSessionValue, getSessionValueOrDefault, setSessionValue, appendToSessionValue} from "../../services/session"
import {Bundle, MedicationDispense} from "fhir/r4"
import {getEpsClient} from "../../services/communication/eps-client"

export default [
  {
    method: "POST",
    path: "/dispense/dispense",
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const dispenseNotificationRequest = request.payload as Bundle
      const medicationDispense = dispenseNotificationRequest?.entry
        ?.flatMap(entry => entry?.resource)
        ?.find(resource => resource?.resourceType === "MedicationDispense") as MedicationDispense
      if (!medicationDispense) {
        return responseToolkit.response("Payload must contain at least one MedicationDispense").code(400)
      }

      const prescriptionId = medicationDispense.authorizingPrescription?.[0]?.extension
        ?.find(extension => extension.url === "https://fhir.nhs.uk/StructureDefinition/Extension-DM-GroupIdentifier")
        ?.extension
        ?.find(extension => extension.url === "shortForm")
        ?.valueIdentifier?.value
      if (!prescriptionId) {
        return responseToolkit.response("MedicationDispense required extension missing").code(400)
      }

      const accessToken = getSessionValue("access_token", request)
      const epsClient = getEpsClient(accessToken)
      const dispenseNotificationResponse = await epsClient.makeSendRequest(dispenseNotificationRequest)
      const dispenseNotificationRequestHl7 = await epsClient.makeConvertRequest(dispenseNotificationRequest)
      const success = dispenseNotificationResponse.statusCode === 200
      if (success) {
        const key = `dispense_notification_requests_${prescriptionId}`
        const dispenseNotificationRequests = getSessionValueOrDefault(key, request, [])
        dispenseNotificationRequests.push(dispenseNotificationRequest)
        setSessionValue(key, dispenseNotificationRequests, request)
        appendToSessionValue("dispensed_prescription_ids", [prescriptionId], request)
      }

      return responseToolkit.response({
        success: success,
        request_xml: dispenseNotificationRequestHl7,
        request: dispenseNotificationRequest,
        response: dispenseNotificationResponse.fhirResponse,
        response_xml: dispenseNotificationResponse.spineResponse
      }).code(200)
    }
  },
  {
    method: "GET",
    path: "/dispenseNotifications/{prescriptionId}",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const prescriptionId = request.params.prescriptionId
      if (!prescriptionId) {
        return h.response("Prescription id required in path").code(400)
      }
      const key = `dispense_notification_requests_${prescriptionId}`
      const dispenseNotificationRequests = getSessionValueOrDefault(key, request, [])
      return h.response(dispenseNotificationRequests).code(200)
    }
  }
]

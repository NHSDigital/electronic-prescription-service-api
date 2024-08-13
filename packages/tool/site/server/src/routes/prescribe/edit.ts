import Hapi, {RouteDefMethods} from "@hapi/hapi"
import {getMedicationRequests} from "../../common/getResources"
import {getSessionValueOrDefault, setSessionValue} from "../../services/session"
import * as fhir from "fhir/r4"
import {CONFIG} from "../../config"
import {PrescriptionId} from "../util"

export default [
  {
    method: "POST" as RouteDefMethods,
    path: "/prescribe/edit",
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const prepareBundles = Array.from(request.payload as Array<fhir.Bundle>)
      const sessionPrescriptionIds: Array<PrescriptionId> = getSessionValueOrDefault("prescription_ids", request, [])

      prepareBundles.forEach((prepareBundle: fhir.Bundle) => {
        const prescriptionId = getMedicationRequests(prepareBundle)[0].groupIdentifier?.value ?? ""
        if (prescriptionId) {
          const prescription = {bundleId: prepareBundle.id, prescriptionId}
          const existingPrescriptionIndex = sessionPrescriptionIds.findIndex(sessionId => {
            // eslint-disable-next-line max-len
            return sessionId.bundleId === prescription.bundleId && sessionId.prescriptionId === prescription.prescriptionId
          })

          if (existingPrescriptionIndex === -1) {
            sessionPrescriptionIds.push(prescription)
          } else {
            sessionPrescriptionIds[existingPrescriptionIndex] = prescription
          }

          setSessionValue(`prepare_request_${prescriptionId}`, prepareBundle, request)
        }
      })

      setSessionValue("prescription_ids", sessionPrescriptionIds, request)
      const prescriptionId = sessionPrescriptionIds[0].prescriptionId
      setSessionValue("prescription_id", prescriptionId, request)

      return responseToolkit.response({
        redirectUri: `${CONFIG.baseUrl}prescribe/edit`
      }).code(200)
    }
  }
]

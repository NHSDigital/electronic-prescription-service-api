import * as requestValidator from "../../validators/request-validator"
import Hapi from "@hapi/hapi";
import {Bundle} from "../../services/fhir-resources";

export const routes = [
  /*
    Send a signed message on to SPINE.
  */
  {
    method: 'POST',
    path: '/Send',
    handler: (request: Hapi.Request, h: Hapi.ResponseToolkit): Hapi.ResponseObject => {
      requestValidator.verifyPrescriptionAndSignatureBundle(<Bundle>request.payload)
      return h.response("Message Sent")
    }
  }
]

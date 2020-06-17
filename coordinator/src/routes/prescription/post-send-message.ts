import * as requestValidator from "../../validators/request-validator"
import Hapi from "@hapi/hapi"

export default [
  /*
    Send a signed message on to SPINE.
  */
  {
    method: 'POST',
    path: '/Send',
    handler: (request: Hapi.Request, h: Hapi.ResponseToolkit): Hapi.ResponseObject => {
      requestValidator.verifyPrescriptionAndSignatureBundle(request.payload)
      return h.response("Message Sent")
    }
  }
]

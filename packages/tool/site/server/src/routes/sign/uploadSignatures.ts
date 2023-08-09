import Hapi from "@hapi/hapi"
import * as uuid from "uuid"
import {setSessionValue} from "../../services/session"
import {base64Encode} from "../helpers"

export default [
  {
    method: "POST",
    path: "/sign/upload-signatures",
    options: {
      auth: false
    },
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const signatureToken = base64Encode(uuid.v4())
      setSessionValue(`signature_${signatureToken}`, request.payload, request)
      return responseToolkit.response({signatureToken}).code(200)
    }
  }
]

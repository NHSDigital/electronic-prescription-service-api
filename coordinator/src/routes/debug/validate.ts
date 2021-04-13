import Hapi from "@hapi/hapi"
import {
  BASE_PATH, externalValidator
} from "../util"

export default [
  /*
    Validate a FHIR message using the external FHIR validator.
  */
  {
    method: "POST",
    path: `${BASE_PATH}/$validate`,
    handler: externalValidator
  } as Hapi.ServerRoute
]

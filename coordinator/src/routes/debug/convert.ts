import {BASE_PATH, externalValidator, validator} from "../util"

export default [
  /*
    Convert a FHIR message into an HL7 V3 message.
  */
  {
    method: "POST",
    path: `${BASE_PATH}/$convert`,
    handler: externalValidator(validator())
  }
]

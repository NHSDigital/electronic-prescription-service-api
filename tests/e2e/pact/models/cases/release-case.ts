import * as fhir from "../fhir/fhir-resources"
import {Case} from "./case"
import {ExampleFile} from "../files/example-file"

export class ReleaseCase extends Case {
  description: string
  request: fhir.Parameters
  response: fhir.Bundle

  constructor(requestFile: ExampleFile, responseFile: ExampleFile) {
    super(requestFile, responseFile)
  }
}

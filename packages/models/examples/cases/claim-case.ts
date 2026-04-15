import {Case} from "./case"
import * as fhir from "../../fhir"
import {ExampleFile} from "../example-file"

export class ClaimCase extends Case {
  description: string
  request: fhir.Claim
  response?: fhir.OperationOutcome

  constructor(requestFile: ExampleFile, responseFile: ExampleFile) {
    super(requestFile, responseFile)
  }
}

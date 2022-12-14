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

  toJestCase(): [string, fhir.Claim, fhir.OperationOutcome, number] {
    return [this.description, this.request, this.response, this.statusCode]
  }
}

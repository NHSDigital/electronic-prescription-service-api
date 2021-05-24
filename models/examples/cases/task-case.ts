import {Case} from "./case"
import {ExampleFile} from "../example-file"
import * as fhir from "../../fhir"

export class TaskCase extends Case {
  description: string
  request: fhir.Parameters | fhir.Task
  response: fhir.Bundle

  constructor(requestFile: ExampleFile, responseFile: ExampleFile) {
    super(requestFile, responseFile)
  }

  toJestCase(): [string, fhir.Parameters | fhir.Task, fhir.Bundle, number] {
    return [this.description, this.request, this.response, this.statusCode]
  }
}

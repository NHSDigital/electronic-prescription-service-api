import {Case} from "./case"
import {ExampleFile} from "../example-file"
import * as fhir from "../../fhir"

export class TaskCase extends Case {
  description: string
  request: fhir.Task
  response: fhir.Bundle
  operation: string

  constructor(requestFile: ExampleFile, responseFile: ExampleFile, operation: string) {
    super(requestFile, responseFile)
    this.operation = operation
  }

  toJestCase(): [string, fhir.Task, fhir.Bundle, number] {
    return [this.description, this.request, this.response, this.statusCode]
  }
}

import {Bundle} from "../fhir/fhir-resources"
import {Case} from "./case"

export class ProcessCase extends Case {
  description: string
  request: Bundle

  constructor(description: string, requestFile: string) {
    super(description, requestFile)
  }
}
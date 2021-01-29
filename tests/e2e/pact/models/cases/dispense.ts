import * as fhir from "../fhir/fhir-resources"
import {Case} from "./case"

export class ReleaseCase extends Case {
  description: string
  request: fhir.Parameters
  response: fhir.Bundle

  constructor(description: string, path: string, statusText: string) {
    super(description, path, statusText)

    this.response = {
      resourceType: "Bundle",
      id: "",
      identifier: {
        value: ""
      },
      entry: []
    }
  }
}

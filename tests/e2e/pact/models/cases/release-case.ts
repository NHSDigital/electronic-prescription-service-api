import {Case} from "./case"
import {ExampleFile} from "../files/example-file"
import {Parameters} from "../../../../../coordinator/src/models/fhir/parameters"
import {Bundle} from "../../../../../coordinator/src/models/fhir/bundle"

export class ReleaseCase extends Case {
  description: string
  request: Parameters
  response: Bundle

  constructor(requestFile: ExampleFile, responseFile: ExampleFile) {
    super(requestFile, responseFile)
  }
}

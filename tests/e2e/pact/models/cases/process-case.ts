import {Bundle} from "../fhir/fhir-resources"
import * as LosslessJson from "lossless-json"
import * as fs from "fs"

export class ProcessCase {
  description: string
  request: Bundle

  constructor(description: string, requestFile: string) {
    const requestString = fs.readFileSync(requestFile, "utf-8")

    const bundleRequest = LosslessJson.parse(requestString) as Bundle
    bundleRequest.identifier.value = uuid.v4()


    this.description = description
    this.request = bundleRequest
  }
}
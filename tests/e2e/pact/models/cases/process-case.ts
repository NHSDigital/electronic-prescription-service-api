import {Bundle} from "../fhir/fhir-resources"
import * as LosslessJson from "lossless-json"
import * as fs from "fs"
import * as path from "path"

export class ProcessCase {
  description: string
  request: Bundle

  constructor(baseLocation: string, location: string, requestFile: string, description: string = null) {
    const requestString = fs.readFileSync(path.join(__dirname, "../../resources", baseLocation, location, requestFile), "utf-8")

    const requestJson = LosslessJson.parse(requestString)

    this.description = description || location.replace(/\//g, " ")
    this.request = requestJson
  }
}
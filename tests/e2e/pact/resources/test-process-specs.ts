import { Bundle } from "./fhir-resources"
import * as LosslessJson from "lossless-json"
import * as fs from "fs"
import * as path from "path"


export class ProcessSpec {
  description: string
  request: Bundle

  constructor(baseLocation: string, location: string, requestFile: string, description: string = null) {
    const requestString = fs.readFileSync(path.join(__dirname, baseLocation, location, requestFile), "utf-8")

    const requestJson = LosslessJson.parse(requestString)

    this.description = description || location.replace(/\//g, " ")
    this.request = requestJson
  }
}
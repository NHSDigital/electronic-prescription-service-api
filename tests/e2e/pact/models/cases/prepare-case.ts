import { Bundle, Parameters } from "../fhir/fhir-resources"
import * as LosslessJson from "lossless-json"
import * as fs from "fs"
import * as path from "path"


export class PrepareCase {
  description: string
	request: Bundle
	response: Parameters

  constructor(baseLocation: string, location: string, requestFile: string, responseFile: string, description: string = null) {
		const requestString = fs.readFileSync(path.join(__dirname, "../../resources", baseLocation, location, requestFile), "utf-8")
		const responseString = fs.readFileSync(path.join(__dirname, "../../resources", baseLocation, location, responseFile), "utf-8")

		const requestJson = LosslessJson.parse(requestString)
		const responseJson = LosslessJson.parse(responseString)

    this.description = description || location.replace(/\//g, " ")
		this.request = requestJson
		this.response = responseJson
  }
}
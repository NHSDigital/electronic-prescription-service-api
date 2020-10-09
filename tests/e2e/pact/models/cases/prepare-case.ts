import { Bundle, Parameters } from "../fhir/fhir-resources"
import * as LosslessJson from "lossless-json"
import * as fs from "fs"

export class PrepareCase {
  description: string
	request: Bundle
	response: Parameters

  constructor(description: string, requestFile: string, responseFile: string) {
		const requestString = fs.readFileSync(requestFile, "utf-8")
		const responseString = fs.readFileSync(responseFile, "utf-8")

		const requestJson = LosslessJson.parse(requestString)
		const responseJson = LosslessJson.parse(responseString)

    this.description = description
		this.request = requestJson
		this.response = responseJson
  }
}
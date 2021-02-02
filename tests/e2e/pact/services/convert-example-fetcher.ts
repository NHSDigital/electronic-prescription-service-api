import { ConvertCase } from "../models/cases/convert-case"
import { exampleFiles } from "./example-files-fetcher"
import { ExampleFile } from "../models/files/example-file"
import {createExampleDescription} from "../resources/common"

const convertResponseFiles = exampleFiles.filter(exampleFile => exampleFile.isResponse && exampleFile.endpoint === "convert")

const convertRequestFiles = exampleFiles.filter(exampleFile =>
	exampleFile.isRequest
	&& convertResponseFiles.some(convertResponseFile =>
			convertResponseFile.dir === exampleFile.dir
			&& convertResponseFile.operation === exampleFile.operation
			&& convertResponseFile.number === exampleFile.number))

const conventionBasedConvertExamples: ConvertCase[] = convertResponseFiles.map(convertResponseFile => new ConvertCase(
	createExampleDescription(convertResponseFile),
	getRequest(convertResponseFile),
  convertResponseFile.path,
  convertResponseFile.statusText
))

function getRequest(convertResponseFile: ExampleFile) {
	const requestPath = convertRequestFiles.find(convertRequestFile =>
		convertRequestFile.dir === convertResponseFile.dir
		&& convertRequestFile.operation === convertResponseFile.operation
		&& convertRequestFile.number === convertResponseFile.number
		&& convertRequestFile.isRequest
	)?.path || ""

	if (!requestPath) {
		throw Error(`Could not find request for convert response: ${convertResponseFile.path}`)
	}

	return requestPath
}

export const convertExamples = conventionBasedConvertExamples

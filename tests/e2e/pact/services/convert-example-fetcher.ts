import path from "path"
import { ConvertCase } from "../models/cases/convert-case"
import { exampleFiles } from "./example-files-fetcher"
import { ExampleFile } from "../models/files/example-file"

const examplesRootPath = "../resources/parent-prescription"

const convertResponseFiles = exampleFiles.filter(exampleFile => exampleFile.isResponse && exampleFile.endpoint === "convert")

const convertRequestFiles = exampleFiles.filter(exampleFile =>
	exampleFile.isRequest
	&& convertResponseFiles.some(convertResponseFile => 
			convertResponseFile.dir === exampleFile.dir
			&& convertResponseFile.operation === exampleFile.operation
			&& convertResponseFile.number === exampleFile.number))

const conventionBasedConvertExamples: ConvertCase[] = convertResponseFiles.map(convertResponseFile => new ConvertCase(
	getDescription(convertResponseFile),
	getRequest(convertResponseFile),
	getResponse(convertResponseFile)
))

function getDescription(convertResponseFile: ExampleFile): string {
	return path.parse(path.relative(path.join(__dirname, examplesRootPath), convertResponseFile.path)).dir.replace(/\//g, " ") + " "
		+ `${convertResponseFile.number} ${convertResponseFile.operation} ${convertResponseFile.statusCode}`
}

function getRequest(convertResponseFile: ExampleFile) {
	const requestPath = convertRequestFiles.find(convertRequestFile =>
		convertRequestFile.dir === convertResponseFile.dir
		&& convertRequestFile.operation === convertResponseFile.operation
		&& convertRequestFile.number === convertResponseFile.number
	)?.path || ""

	if (!requestPath) {
		throw Error(`Could not find request for convert response: ${convertResponseFile.path}`)
	}

	return requestPath
}

function getResponse(convertResponseFile: ExampleFile): string {
	return convertResponseFile.path
}

export const convertExamples = conventionBasedConvertExamples
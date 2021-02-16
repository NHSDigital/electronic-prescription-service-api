import {ConvertCase} from "../models/cases/convert-case"
import {exampleFiles} from "./example-files-fetcher"
import {ExampleFile} from "../models/files/example-file"

const convertResponseFiles = exampleFiles.filter(exampleFile => exampleFile.isResponse && exampleFile.endpoint === "convert")

const convertRequestFiles = exampleFiles.filter(exampleFile =>
	exampleFile.isRequest
	&& convertResponseFiles.some(convertResponseFile =>
		convertResponseFile.dir === exampleFile.dir
		&& convertResponseFile.operation === exampleFile.operation
		&& convertResponseFile.number === exampleFile.number))

const conventionBasedConvertExamples: ConvertCase[] = convertResponseFiles.map(convertResponseFile =>
  new ConvertCase(getRequestFile(convertResponseFile), convertResponseFile)
)

function getRequestFile(convertResponseFile: ExampleFile) {
	const requestFile = convertRequestFiles.find(convertRequestFile =>
		convertRequestFile.dir === convertResponseFile.dir
		&& convertRequestFile.operation === convertResponseFile.operation
		&& convertRequestFile.number === convertResponseFile.number
		&& convertRequestFile.isRequest
	)

	if (!requestFile) {
		throw Error(`Could not find request for convert response: ${convertResponseFile.path}`)
	}

	return requestFile
}

export const convertExamples = conventionBasedConvertExamples

import path from "path"
import { PrepareCase } from "../models/cases/prepare-case"
import { ExampleFile } from "../models/files/example-file"
import { exampleFiles } from "./example-files-fetcher"

const examplesRootPath = "../resources/parent-prescription"

const prepareResponseFiles = exampleFiles.filter(exampleFile => exampleFile.isResponse && exampleFile.endpoint === "prepare")

const prepareRequestFiles = exampleFiles.filter(exampleFile =>
	exampleFile.isRequest && exampleFile.endpoint == "prepare"
	&& prepareResponseFiles.some(prepareResponseFile =>
			prepareResponseFile.dir === exampleFile.dir
			&& prepareResponseFile.endpoint === exampleFile.endpoint
			&& prepareResponseFile.number === exampleFile.number))

const conventionBasedPrepareExamples: PrepareCase[] = prepareResponseFiles.map(prepareResponseFile => new PrepareCase(
	getDescription(prepareResponseFile),
	getRequest(prepareResponseFile),
	getResponse(prepareResponseFile),
	getStatusText(prepareResponseFile)
))

function getDescription(prepareResponseFile: ExampleFile): string {
	return path.parse(path.relative(path.join(__dirname, examplesRootPath), prepareResponseFile.path))
		.dir.replace(/\//g, " ").replace(/\\/g, " ") + " "
		+ `${prepareResponseFile.number} ${prepareResponseFile.statusText}`
}

function getRequest(prepareResponseFile: ExampleFile): string {
	return prepareRequestFiles.find(prepareRequestFile => prepareRequestFile.dir === prepareResponseFile.dir
		&& prepareRequestFile.endpoint === prepareResponseFile.endpoint
		&& prepareRequestFile.number === prepareResponseFile.number
	).path
}

function getResponse(prepareResponseFile: ExampleFile): string {
	return prepareResponseFile.path
}

function getStatusText(prepareResponseFile: ExampleFile): string {
	return prepareResponseFile.statusText
}

export const prepareExamples = conventionBasedPrepareExamples
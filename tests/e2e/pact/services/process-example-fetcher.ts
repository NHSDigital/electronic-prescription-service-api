import path from "path"
import { ProcessCase } from "../models/cases/process-case"
import { ExampleFile } from "../models/files/example-file"
import { exampleFiles } from "./example-files-fetcher"

const examplesRootPath = "../resources/parent-prescription"

const processRequestFiles = exampleFiles.filter(exampleFile => exampleFile.isRequest && exampleFile.endpoint === "process")

const conventionBasedProcessExamples: ProcessCase[] = processRequestFiles.map(processRequestFile => new ProcessCase(
	getDescription(processRequestFile),
	getRequest(processRequestFile),
	getStatusText(processRequestFile)
))

function getDescription(processRequestFile: ExampleFile): string {
	return path.parse(path.relative(path.join(__dirname, examplesRootPath), processRequestFile.path))
		.dir.replace(/\//g, " ").replace(/\\/g, " ") + " "
		+ `${processRequestFile.number} ${processRequestFile.statusText} ${processRequestFile.operation}`
}

function getRequest(processRequestFile: ExampleFile): string {
	return processRequestFile.path
}

function getStatusText(processRequestFile: ExampleFile): string {
	return processRequestFile.statusText
}

export const processExamples = conventionBasedProcessExamples
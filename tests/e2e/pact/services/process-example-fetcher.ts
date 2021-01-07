import path from "path"
import { ProcessCase } from "../models/cases/process-case"
import { exampleFiles } from "./example-files-fetcher"

const examplesRootPath = "../resources/parent-prescription"

const processRequestFiles = exampleFiles.filter(exampleFile => exampleFile.isRequest && exampleFile.endpoint === "process")

const conventionBasedProcessExamples: ProcessCase[] = processRequestFiles.map(processRequestFile => new ProcessCase(
	path.parse(path.relative(path.join(__dirname, examplesRootPath), processRequestFile.path)).dir.replace(/\//g, " ") + " "
		+ `${processRequestFile.number} ${processRequestFile.statusText} ${processRequestFile.operation}`,
	processRequestFile.path,
	processRequestFile.statusText
))

export const processExamples = conventionBasedProcessExamples
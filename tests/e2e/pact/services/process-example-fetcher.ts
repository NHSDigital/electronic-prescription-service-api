import { ProcessCase } from "../models/cases/process-case"
import { ExampleFile } from "../models/files/example-file"
import { exampleFiles } from "./example-files-fetcher"
import { createExampleDescription } from "../resources/common"

const processRequestFiles = exampleFiles.filter(exampleFile => exampleFile.isRequest && exampleFile.endpoint === "process")

const conventionBasedProcessExamples: ProcessCase[] = processRequestFiles.map(processRequestFile => new ProcessCase(
	createExampleDescription(processRequestFile),
	processRequestFile.path,
	processRequestFile.statusText
))

export const processExamples = conventionBasedProcessExamples

import { PrepareCase } from "../models/cases/prepare-case"
import { exampleFiles } from "./example-files-fetcher"
import {createExampleDescription} from "../resources/common"

const prepareResponseFiles = exampleFiles.filter(exampleFile => exampleFile.isResponse && exampleFile.endpoint === "prepare")

const prepareRequestFiles = exampleFiles.filter(exampleFile =>
	exampleFile.isRequest && exampleFile.endpoint == "prepare"
	&& prepareResponseFiles.some(prepareResponseFile =>
			prepareResponseFile.dir === exampleFile.dir
			&& prepareResponseFile.endpoint === exampleFile.endpoint
			&& prepareResponseFile.number === exampleFile.number))

const conventionBasedPrepareExamples: PrepareCase[] = prepareResponseFiles.map(prepareResponseFile => new PrepareCase(
	createExampleDescription(prepareResponseFile),
	prepareRequestFiles.find(prepareRequestFile =>
		prepareRequestFile.dir === prepareResponseFile.dir
		&& prepareRequestFile.endpoint === prepareResponseFile.endpoint
		&& prepareRequestFile.number === prepareResponseFile.number
	).path,
	prepareResponseFile.path,
	prepareResponseFile.statusText
))

export const prepareExamples = conventionBasedPrepareExamples

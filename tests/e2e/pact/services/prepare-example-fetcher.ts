import path from "path"
import { PrepareCase } from "../models/cases/prepare-case"
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
	path.parse(path.relative(path.join(__dirname, examplesRootPath), prepareResponseFile.path)).dir.replace(/\//g, " ") + " "
		+ `${prepareResponseFile.number} ${prepareResponseFile.statusCode}`,
	prepareRequestFiles.find(prepareRequestFile =>
		prepareRequestFile.dir === prepareResponseFile.dir
		&& prepareRequestFile.endpoint === prepareResponseFile.endpoint
		&& prepareRequestFile.number === prepareResponseFile.number
	).path,
	prepareResponseFile.path
))

const prepareSpecificationSuccessExamples = [1,2,3,4].map(i => new PrepareCase(
  `parent-prescription-${i} specification example unsigned`,
  path.join(__dirname, examplesRootPath, `/../parent-prescription-${i}/PrepareRequest-FhirMessageUnsigned.json`),
  path.join(__dirname, examplesRootPath, `/../parent-prescription-${i}/PrepareResponse-FhirMessageDigest.json`)))

export const prepareExamples = [
	...prepareSpecificationSuccessExamples,
	...conventionBasedPrepareExamples
]
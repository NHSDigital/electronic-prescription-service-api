import path from "path"
import { ConvertCase } from "../models/cases/convert-case"
import { exampleFiles } from "./example-files-fetcher"

const examplesRootPath = "../resources/parent-prescription"

const convertResponseFiles = exampleFiles.filter(exampleFile => exampleFile.isResponse && exampleFile.endpoint === "convert")

const convertRequestFiles = exampleFiles.filter(exampleFile =>
	exampleFile.isRequest
	&& convertResponseFiles.some(convertResponseFile => 
			convertResponseFile.dir === exampleFile.dir
			&& convertResponseFile.operation === exampleFile.operation
			&& convertResponseFile.number === exampleFile.number))

const conventionBasedConvertExamples: ConvertCase[] = convertResponseFiles.map(convertResponseFile => new ConvertCase(
	path.parse(path.relative(path.join(__dirname, examplesRootPath), convertResponseFile.path)).dir.replace(/\//g, " ") + " "
		+ `${convertResponseFile.number} ${convertResponseFile.operation} ${convertResponseFile.statusCode}`,
	convertRequestFiles.find(convertRequestFile =>
		convertRequestFile.dir === convertResponseFile.dir
		&& convertRequestFile.operation === convertResponseFile.operation
		&& convertRequestFile.number === convertResponseFile.number
	).path,
	convertResponseFile.path
))

const convertUnsignedSpecificationSuccessExamples = [1, 2, 3, 4].map(i => new ConvertCase(
	`parent-prescription-${i} specification example unsigned`,
	path.join(__dirname, examplesRootPath, `/../parent-prescription-${i}/PrepareRequest-FhirMessageUnsigned.json`),
	path.join(__dirname, examplesRootPath, `/../parent-prescription-${i}/ConvertResponse-UnsignedHl7V3Message.xml`)))

const convertSignedSpecificationSuccessExamples = [1, 2, 3, 4].map(i => new ConvertCase(
	`parent-prescription-${i} specification example signed`,
	path.join(__dirname, examplesRootPath, `/../parent-prescription-${i}/SendRequest-FhirMessageSigned.json`),
	path.join(__dirname, examplesRootPath, `/../parent-prescription-${i}/ConvertResponse-SignedHl7V3Message.xml`)))

const convertCancelSpecificationSuccessExamples = [3].map(i => new ConvertCase(
	`parent-prescription-${i} specification example cancel`,
	path.join(__dirname, examplesRootPath, `/../parent-prescription-${i}/CancelRequest-FhirMessage.json`),
	path.join(__dirname, examplesRootPath, `/../parent-prescription-${i}/CancelResponse-Hl7V3Message.xml`)))

export const convertExamples = [
	...convertUnsignedSpecificationSuccessExamples,
	...convertSignedSpecificationSuccessExamples,
	...convertCancelSpecificationSuccessExamples,
	...conventionBasedConvertExamples
]
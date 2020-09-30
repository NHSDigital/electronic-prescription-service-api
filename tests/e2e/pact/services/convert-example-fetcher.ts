import path from "path"
import { ConvertCase } from "../models/cases/convert-case"
import { allExamplePaths, rootPath } from "./example-fetcher"

const convertResponsePaths = allExamplePaths.filter(examplePath => {
	const filename = path.basename(examplePath)
	return filename.endsWith(".xml")
})

const convertRequestPaths: Array<string> = allExamplePaths.filter(examplePath => {
	const filename = path.basename(examplePath)
	const isRequestFile = filename.endsWith(".json") && filename.split("-")[2] === "Request"
	if (isRequestFile) {
		const id = filename.split("-")[0]
		const requestEndpoint = filename.split("-")[1]
		const convertResponseFilenames = convertResponsePaths.map(convertResponsePath => path.basename(convertResponsePath))
		const hasConvertResponse = convertResponseFilenames.some(convertResponseFilename => convertResponseFilename.startsWith(`${id}-Convert-Response-${requestEndpoint}`))
		return hasConvertResponse
	}
	return false
})

const conventionBasedConvertExamples: ConvertCase[] = convertResponsePaths.map(convertResponsePath => new ConvertCase(
	path.parse(path.relative(path.join(__dirname, rootPath), convertResponsePath)).dir.replace(/\./g, "").replace(/\//g, " ")+ " " + path.parse(convertResponsePath).name.split("-")[0] + " " + path.parse(convertResponsePath).name.split("-")[3].toLowerCase() + " " + path.parse(convertResponsePath).name.split("-")[4].replace(/_/g, " "),
	convertRequestPaths.find(convertRequestPath =>
		path.parse(convertRequestPath).dir === path.parse(convertResponsePath).dir
		&& path.basename(convertRequestPath).split("-")[1] === path.basename(convertResponsePath).split("-")[3]
		&& path.parse(convertRequestPath).name.split("-")[0] === path.parse(convertResponsePath).name.split("-")[0]
	),
	convertResponsePath
))

const convertUnsignedSpecificationSuccessExamples = [1, 2, 3, 4].map(i => new ConvertCase(
	`parent-prescription-${i} specification example unsigned`,
	path.join(__dirname, rootPath, `/../parent-prescription-${i}/PrepareRequest-FhirMessageUnsigned.json`),
	path.join(__dirname, rootPath, `/../parent-prescription-${i}/ConvertResponse-UnsignedHl7V3Message.xml`)))

const convertSignedSpecificationSuccessExamples = [1, 2, 3, 4].map(i => new ConvertCase(
	`parent-prescription-${i} specification example signed`,
	path.join(__dirname, rootPath, `/../parent-prescription-${i}/SendRequest-FhirMessageSigned.json`),
	path.join(__dirname, rootPath, `/../parent-prescription-${i}/ConvertResponse-SignedHl7V3Message.xml`)))

const convertCancelSpecificationSuccessExamples = [3].map(i => new ConvertCase(
	`parent-prescription-${i} specification example cancel`,
	path.join(__dirname, rootPath, `/../parent-prescription-${i}/CancelRequest-FhirMessage.json`),
	path.join(__dirname, rootPath, `/../parent-prescription-${i}/CancelResponse-Hl7V3Message.xml`)))

export const convertExamples = [
	...convertUnsignedSpecificationSuccessExamples,
	...convertSignedSpecificationSuccessExamples,
	...convertCancelSpecificationSuccessExamples,
	...conventionBasedConvertExamples
]
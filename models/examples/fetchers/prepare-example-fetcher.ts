import {PrepareCase} from "../cases/prepare-case"
import {ExampleFile} from "../example-file"
import {exampleFiles} from "./example-files-fetcher"

const prepareResponseFiles = exampleFiles.filter(exampleFile => exampleFile.isResponse && exampleFile.endpoint === "prepare")

const prepareRequestFiles = exampleFiles.filter(exampleFile =>
  exampleFile.isRequest && exampleFile.endpoint == "prepare"
  && prepareResponseFiles.some(
  prepareResponseFile =>
    prepareResponseFile.dir === exampleFile.dir
    && prepareResponseFile.endpoint === exampleFile.endpoint
    && prepareResponseFile.number === exampleFile.number)
)

const conventionBasedPrepareExamples: PrepareCase[] = prepareResponseFiles.map(prepareResponseFile =>
  new PrepareCase(getRequest(prepareResponseFile), prepareResponseFile)
)

function getRequest(prepareResponseFile: ExampleFile) {
  return prepareRequestFiles.find(prepareRequestFile =>
    prepareRequestFile.dir === prepareResponseFile.dir
    && prepareRequestFile.endpoint === prepareResponseFile.endpoint
    && prepareRequestFile.number === prepareResponseFile.number
  )
}

export const prepareExamples = conventionBasedPrepareExamples

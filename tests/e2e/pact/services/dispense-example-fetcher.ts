import {exampleFiles} from "./example-files-fetcher"
import {ReleaseCase} from "../models/cases/dispense"
import {createExampleDescription} from "../resources/common"

export const releaseExamples = exampleFiles
  .filter(exampleFile => exampleFile.isRequest && exampleFile.endpoint === "release")
  .map(
    exampleFile => new ReleaseCase(createExampleDescription(exampleFile),
    exampleFile.path,
    exampleFile.statusText
  ))

export const dispenseExamples = exampleFiles.filter(
  exampleFile => exampleFile.isRequest && exampleFile.endpoint === "dispense"
)

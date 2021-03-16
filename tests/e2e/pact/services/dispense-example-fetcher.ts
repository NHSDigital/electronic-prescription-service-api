import {exampleFiles} from "./example-files-fetcher"
import {ReleaseCase} from "../models/cases/release-case"

export const releaseExamples = exampleFiles
  .filter(exampleFile => exampleFile.isRequest && exampleFile.endpoint === "task" && exampleFile.operation === "release")
  .map(exampleFile => new ReleaseCase(exampleFile, null))

export const dispenseExamples = exampleFiles.filter(
  exampleFile => exampleFile.isRequest && exampleFile.endpoint === "process" && exampleFile.operation === "dispense"
)

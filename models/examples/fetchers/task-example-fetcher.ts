import {exampleFiles} from "./example-files-fetcher"
import {ReleaseCase} from "../cases/release-case"

export const taskExamples = exampleFiles
  .filter(exampleFile => exampleFile.isRequest && exampleFile.endpoint === "task")
  .map(exampleFile => new ReleaseCase(exampleFile, null))

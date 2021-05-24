import {exampleFiles} from "./example-files-fetcher"
import {TaskCase} from "../cases/task-case"

export const taskExamples = exampleFiles
  .filter(exampleFile => exampleFile.isRequest && exampleFile.endpoint === "task")
  .map(exampleFile => new TaskCase(exampleFile, null))

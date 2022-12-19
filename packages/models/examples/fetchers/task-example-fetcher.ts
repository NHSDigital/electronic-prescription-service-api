import {exampleFiles} from "./example-files-fetcher"
import {TaskCase} from "../cases/task-case"
import {TaskReleaseCase} from "../cases/task-release-case"

export const taskExamples = exampleFiles
  .filter(
    exampleFile => exampleFile.isRequest
      && exampleFile.endpoint === "task"
      && exampleFile.operation !== "release"
  )
  .map(exampleFile => new TaskCase(exampleFile, null, exampleFile.operation))

export const taskReturnExamples = taskExamples.filter(taskExample => taskExample.operation === "return")
export const taskWithdrawExamples = taskExamples.filter(taskExample => taskExample.operation === "withdraw")

export const taskReleaseExamples = exampleFiles
  .filter(
    exampleFile => exampleFile.isRequest
      && exampleFile.endpoint === "task"
      && exampleFile.operation === "release"
  )
  .map(exampleFile => new TaskReleaseCase(exampleFile, null))

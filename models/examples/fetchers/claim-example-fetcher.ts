import {exampleFiles} from "./example-files-fetcher"
import {ClaimCase} from "../cases/claim-case"

export const claimExamples = exampleFiles
  .filter(exampleFile => exampleFile.isRequest && exampleFile.endpoint === "claim")
  .map(exampleFile => new ClaimCase(exampleFile, null))

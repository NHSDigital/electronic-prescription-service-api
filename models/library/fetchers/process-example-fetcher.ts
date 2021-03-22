import {ProcessCase} from "../cases/process-case"
import {exampleFiles} from "./example-files-fetcher"

const processRequestFiles = exampleFiles.filter(exampleFile => exampleFile.isRequest && exampleFile.endpoint === "process")
const prescriptionOrderFiles = processRequestFiles.filter(exampleFile => exampleFile.operation === "send")
const prescriptionOrderUpdateFiles = processRequestFiles.filter(exampleFile => exampleFile.operation === "cancel")
const prescriptionDispenseFiles = processRequestFiles.filter(exampleFile => exampleFile.operation === "dispense")
export const prescriptionOrderExamples: ProcessCase[] = prescriptionOrderFiles.map(processRequestFile =>
  new ProcessCase(processRequestFile, null)
)
export const prescriptionOrderUpdateExamples: ProcessCase[] = prescriptionOrderUpdateFiles.map(processRequestFile =>
  new ProcessCase(processRequestFile, null)
)
const prescriptionDispenseExamples: ProcessCase[] = prescriptionDispenseFiles.map(processRequestFile =>
  new ProcessCase(processRequestFile, null)
)

export const processExamples = [
  ...prescriptionOrderExamples,
  ...prescriptionOrderUpdateExamples,
  ...prescriptionDispenseExamples
]
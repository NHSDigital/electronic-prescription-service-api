import {fetcher} from "@models"
import {ApiOperation} from "./common"

function getProcessCases(operation: ApiOperation) {
  return fetcher.processExamples
    .filter(e => e.isSuccess)
    .filter(e => e.requestFile.operation === operation)
    .map(spec => spec.toJestCase())
}

function getTaskCases(operation: ApiOperation) {
  return fetcher.taskExamples
    .filter(e => e.isSuccess)
    .filter(e => e.requestFile.operation === operation)
    .map(spec => spec.toJestCase())
}

// take the first 10 convert success examples as pact struggles with large regex matching
// todo: we should look to move away from this, investigation into whether TKW validation will handle testing
// conversions for us from process message tests
export const convertCaseGroups = fetcher.convertExamples.filter(e => e.isSuccess).map(spec => spec.toSuccessJestCase()).slice(0, 10)
// *********************************************

export const convertErrorCases = fetcher.convertExamples.filter(e => !e.isSuccess).map(spec => spec.toErrorJestCase())

export const prepareCaseGroups = fetcher.prepareExamples.filter(e => e.isSuccess).map(spec => spec.toJestCase())
export const prepareErrorCases = fetcher.prepareExamples.filter(e => !e.isSuccess).map(spec => spec.toJestCase())

export const prepareCaseBundles = prepareCaseGroups.filter(e => e[1].resourceType === "Bundle")

export const processErrorCases = fetcher.processExamples.filter(e => !e.isSuccess).map(spec => spec.toErrorJestCase())

export const processOrderCase = getProcessCases("send")
export const processOrderUpdateCase = getProcessCases("cancel")
export const processDispenseNotificationCase = getProcessCases("dispense")

export const taskReleaseCases = getTaskCases("release")
export const taskReturnCases = getTaskCases("return")
export const taskWithdrawCases = getTaskCases("withdraw")

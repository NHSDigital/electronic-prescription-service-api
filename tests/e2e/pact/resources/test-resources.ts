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

export const convertCaseGroups = fetcher.convertExamples.filter(e => e.isSuccess).map(spec => spec.toSuccessJestCase())
export const convertErrorCases = fetcher.convertExamples.filter(e => !e.isSuccess).map(spec => spec.toErrorJestCase())

export const prepareCaseGroups = fetcher.prepareExamples.filter(e => e.isSuccess).map(spec => spec.toJestCase())
export const prepareErrorCases = fetcher.prepareExamples.filter(e => !e.isSuccess).map(spec => spec.toJestCase())

export const prepareCaseBundles = prepareCaseGroups.filter(e => e[1].resourceType === "Bundle")

export const processOrderCaseGroups = getProcessCases("send")
export const processOrderUpdateCaseGroups = getProcessCases("cancel")
export const processDispenseNotificationCaseGroups = getProcessCases("dispense")

export const taskReleaseCases = getTaskCases("release")
export const taskReturnCases = getTaskCases("return")
export const taskWithdrawCases = getTaskCases("withdraw")

import {fetcher} from "@models"
import {ApiOperation} from "./common"

function getProcessCases(operation: ApiOperation) {
  return fetcher.processExamples
    .filter(e => e.isSuccess)
    .filter(e => e.requestFile.operation === operation)
    .map(spec => spec.toJestCase())
}

export const convertCaseGroups = fetcher.convertExamples.filter(e => e.isSuccess).map(spec => spec.toJestCase())
export const convertErrorCases = fetcher.convertExamples.filter(e => !e.isSuccess).map(spec => [spec.description, spec.request, spec.response, spec.statusCode])

export const prepareCaseGroups = fetcher.prepareExamples.filter(e => e.isSuccess).map(spec => spec.toJestCase())
export const prepareErrorCases = fetcher.prepareExamples.filter(e => !e.isSuccess).map(spec => [spec.description, spec.request, spec.response, spec.statusCode])

export const processOrderCaseGroups = getProcessCases("send")
export const processOrderUpdateCaseGroups = getProcessCases("cancel")
export const processDispenseNotificationCaseGroups = getProcessCases("dispense")

export const taskReleaseCases = fetcher.taskExamples.filter(e => e.isSuccess && e.requestFile.operation === "release").map(spec => [spec.description, spec.request, spec.response, spec.statusCode])
export const taskReturnCases = fetcher.taskExamples.filter(e => e.isSuccess && e.requestFile.operation === "return").map(spec => [spec.description, spec.request, spec.response, spec.statusCode])
export const taskWithdrawCases = fetcher.taskExamples.filter(e => e.isSuccess && e.requestFile.operation === "withdraw").map(spec => [spec.description, spec.request, spec.response, spec.statusCode])

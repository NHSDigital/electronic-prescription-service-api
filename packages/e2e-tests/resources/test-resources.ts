import {fetcher} from "@models"
import {ApiOperation} from "./common"

function getProcessCases(operation: ApiOperation) {
  return fetcher.processExamples
    .filter(e => e.isSuccess)
    .filter(e => e.requestFile.operation === operation)
}

function getTaskReleaseCases() {
  return fetcher.taskReleaseExamples
    .filter(e => e.isSuccess)
}

function getTaskCases(operation: ApiOperation) {
  return fetcher.taskExamples
    .filter(e => e.isSuccess)
    .filter(e => e.requestFile.operation === operation)
}

function getClaimCases() {
  return fetcher.claimExamples
    .filter(e => e.isSuccess)
    .filter(e => e.requestFile.operation !== "amend")
}

function getClaimAmendCases() {
  return fetcher.claimExamples
    .filter(e => e.isSuccess)
    .filter(e => e.requestFile.operation === "amend")
}

export const prepareCaseGroups = fetcher.prepareExamples.filter(e => e.isSuccess)
export const prepareErrorCases = fetcher.prepareExamples.filter(e => !e.isSuccess)

export const prepareCaseBundles = prepareCaseGroups.filter(e => e.request.resourceType === "Bundle")

export const processErrorCases = fetcher.processExamples.filter(e => !e.isSuccess)

export const processOrderCases = getProcessCases("send")
export const processOrderUpdateCases = getProcessCases("cancel")
export const processDispenseNotificationCases = getProcessCases("dispense")
export const processDispenseNotificationAmendCases = getProcessCases("dispenseamend")

export const taskReleaseCases = getTaskReleaseCases()
export const taskReturnCases = getTaskCases("return")
export const taskWithdrawCases = getTaskCases("withdraw")

export const claimCases = getClaimCases()
export const claimAmendCases = getClaimAmendCases()

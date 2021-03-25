import {fetcher} from "@models"
import {pactGroups, cancelPactGroups, PactGroupCases, dispensePactGroups} from "./common"

function getConvertCases(searchString: string) {
  return fetcher.convertExamples
    .filter(e => e.isSuccess)
    .filter(e => e.description.includes(searchString))
    .map(spec => spec.toJestCase())
}

function getPrepareCases(searchString: string) {
  return fetcher.prepareExamples
    .filter(e => e.isSuccess)
    .filter(e => e.description.includes(searchString))
    .map(spec => spec.toJestCase())
}

function getProcessCases(searchString: string, operation: string) {
  return fetcher.processExamples
    .filter(e => e.isSuccess)
    .filter(e => e.description.includes(searchString))
    .filter(e => e.requestFile.operation === operation)
    .map(spec => spec.toJestCase())
}

export const convertCaseGroups = pactGroups.map(pactGroup => new PactGroupCases(pactGroup, getConvertCases(pactGroup)))
export const convertErrorCases = fetcher.convertExamples.filter(e => !e.isSuccess).map(spec => [spec.description, spec.request, spec.response, spec.statusCode])

export const prepareCaseGroups = pactGroups.map(pactGroup => new PactGroupCases(pactGroup, getPrepareCases(pactGroup)))
export const prepareErrorCases = fetcher.convertExamples.filter(e => !e.isSuccess).map(spec => [spec.description, spec.request, spec.response, spec.statusCode])

export const processOrderCaseGroups = pactGroups.map(pactGroup => new PactGroupCases(pactGroup, getProcessCases(pactGroup, "send")))
export const processOrderUpdateCaseGroups = cancelPactGroups.map(pactGroup => new PactGroupCases(pactGroup, getProcessCases(pactGroup, "cancel")))
export const processDispenseNotificationCaseGroups = dispensePactGroups.map(pactGroup => new PactGroupCases(pactGroup, getProcessCases(pactGroup, "dispense")))

export const releaseCases = fetcher.releaseExamples.filter(e => e.isSuccess).map(spec => [spec.description, spec.request, spec.response, spec.statusCode])

export const taskWithdrawCases = fetcher.taskExamples.filter(e => e.isSuccess && e.requestFile.operation === "withdraw").map(spec => [spec.description, spec.request, spec.response, spec.statusCode])
export const taskReturnCases = fetcher.taskExamples.filter(e => e.isSuccess && e.requestFile.operation === "return").map(spec => [spec.description, spec.request, spec.response, spec.statusCode])

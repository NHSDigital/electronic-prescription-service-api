import {processExamples} from "../services/process-example-fetcher"
import {convertExamples} from "../services/convert-example-fetcher"
import {prepareExamples} from "../services/prepare-example-fetcher"
import {releaseExamples} from "../services/dispense-example-fetcher"
import {pactGroups, cancelPactGroups, PactGroupCases} from "./common"
import {taskExamples} from "../services/task-example-fetcher";

function getConvertCases(searchString: string) {
  return convertExamples
    .filter(e => e.isSuccess)
    .filter(e => e.description.includes(searchString))
    .map(spec => spec.toJestCase())
}

function getPrepareCases(searchString: string) {
  return prepareExamples
    .filter(e => e.isSuccess)
    .filter(e => e.description.includes(searchString))
    .map(spec => spec.toJestCase())
}

function getProcessCases(searchString: string, operation: string) {
  return processExamples
    .filter(e => e.isSuccess)
    .filter(e => e.description.includes(searchString))
    .filter(e => e.requestFile.operation === operation)
    .map(spec => spec.toJestCase())
}

export const convertCaseGroups = pactGroups.map(pactGroup => new PactGroupCases(pactGroup, getConvertCases(pactGroup)))
export const convertErrorCases = convertExamples.filter(e => !e.isSuccess).map(spec => [spec.description, spec.request, spec.response, spec.statusCode])

export const prepareCaseGroups = pactGroups.map(pactGroup => new PactGroupCases(pactGroup, getPrepareCases(pactGroup)))
export const prepareErrorCases = convertExamples.filter(e => !e.isSuccess).map(spec => [spec.description, spec.request, spec.response, spec.statusCode])

export const processOrderCaseGroups = pactGroups.map(pactGroup => new PactGroupCases(pactGroup, getProcessCases(pactGroup, "send")))
export const processOrderUpdateCaseGroups = cancelPactGroups.map(pactGroup => new PactGroupCases(pactGroup, getProcessCases(pactGroup, "cancel")))

export const releaseCases = releaseExamples.filter(e => e.isSuccess).map(spec => [spec.description, spec.request, spec.response, spec.statusCode])

export const taskWithdrawCases = taskExamples.filter(e => e.isSuccess && e.requestFile.operation === "withdraw").map(spec => [spec.description, spec.request, spec.response, spec.statusCode])
export const taskReturnCases = taskExamples.filter(e => e.isSuccess && e.requestFile.operation === "return").map(spec => [spec.description, spec.request, spec.response, spec.statusCode])

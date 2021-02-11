import {processExamples} from "../services/process-example-fetcher"
import {convertExamples} from "../services/convert-example-fetcher"
import {prepareExamples} from "../services/prepare-example-fetcher"
import {releaseExamples} from "../services/dispense-example-fetcher"

function getConvertCases(searchString: string) {
  return convertExamples
    .filter(e => e.isSuccess)
    .filter(e => e.description.includes(searchString))
    .map(spec => spec.toJestCase())
}
export const convertSecondaryCareCommunityAcuteCases = getConvertCases("secondary-care community acute")
export const convertSecondaryCareCommunityRepeatDispensingCases = getConvertCases("secondary-care community repeat-dispensing")
export const convertSecondaryCareHomecareCases = getConvertCases("secondary-care homecare")
export const convertPrimaryCareCases = getConvertCases("primary-care")

export const convertErrorCases = convertExamples.filter(e => !e.isSuccess).map(spec => [spec.description, spec.request, spec.response, spec.statusCode])
export const prepareCases = prepareExamples.filter(e => e.isSuccess).map(spec => [spec.description, spec.request, spec.response, spec.statusCode])

function getProcessCases(searchString: string, operation: string) {
  return processExamples
    .filter(e => e.isSuccess)
    .filter(e => e.description.includes(searchString))
    .filter(e => e.requestFile.operation === operation)
    .map(spec => spec.toJestCase())
}
export const processSecondaryCareCommunityAcuteOrderCases = getProcessCases("secondary-care community acute", "send")
export const processSecondaryCareCommunityAcuteOrderUpdateCases = getProcessCases("secondary-care community acute", "cancel")
export const processSecondaryCareCommunityRepeatDispensingOrderCases = getProcessCases("secondary-care community repeat-dispensing", "send")
export const processSecondaryCareCommunityRepeatDispensingOrderUpdateCases = getProcessCases("secondary-care community repeat-dispensing", "cancel")
export const processSecondaryCareHomecareOrderCases = getProcessCases("secondary-care homecare", "send")
export const processSecondaryCareHomecareOrderUpdateCases = getProcessCases("secondary-care homecare", "cancel")
export const processPrimaryCareOrderCases = getProcessCases("primary-care", "send")
export const processPrimaryCareOrderUpdateCases = getProcessCases("primary-care", "cancel")

export const releaseCases = releaseExamples.filter(e => e.isSuccess).map(spec => [spec.description, spec.request, spec.response, spec.statusCode])

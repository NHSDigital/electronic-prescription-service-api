import {processExamples} from "../services/process-example-fetcher"
import {convertExamples} from "../services/convert-example-fetcher"
import {prepareExamples} from "../services/prepare-example-fetcher"

export const convertCases = convertExamples.filter(e => e.isSuccess).map(spec => [spec.description, spec.request, spec.response, spec.responseMatcher, spec.statusCode])
export const convertErrorCases = convertExamples.filter(e => !e.isSuccess).map(spec => [spec.description, spec.request, spec.response, spec.statusCode])
export const prepareCases = prepareExamples.filter(e => e.isSuccess).map(spec => [spec.description, spec.request, spec.response, spec.statusCode])
export const processCases = processExamples.filter(e => e.isSuccess).map(spec => [spec.description, spec.request, spec.prepareResponse, spec.convertResponse, spec.statusCode])

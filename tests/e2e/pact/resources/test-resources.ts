import {processExamples} from "../services/process-example-fetcher"
import {convertExamples} from "../services/convert-example-fetcher"
import {prepareExamples} from "../services/prepare-example-fetcher"

export const convertCases = convertExamples.map(spec => [spec.description, spec.request, spec.response, spec.responseMatcher])
export const prepareCases = prepareExamples.map(spec => [spec.description, spec.request, spec.response])
export const sendCases = processExamples.map(spec => [spec.description, spec.request])
import {processExamples} from "../services/process-example-fetcher"
import {convertExamples} from "../services/convert-example-fetcher"
import {prepareExamples} from "../services/prepare-example-fetcher"

export const convertCases = []
export const processCases = []

export const convertSecondaryCareCommunityAcuteCases =
    convertExamples
        .filter(e => e.isSuccess)
        .filter(e => e.description.includes("secondary-care community acute"))
        .map(spec => [spec.description, spec.request, spec.response, spec.responseMatcher, spec.statusCode])
        
export const convertSecondaryCareCommunityRepeatDispensingCases =
    convertExamples
        .filter(e => e.isSuccess)
        .filter(e => e.description.includes("secondary-care community repeat-dispensing"))
        .map(spec => [spec.description, spec.request, spec.response, spec.responseMatcher, spec.statusCode])

export const convertSecondaryCareHomecareCases =
    convertExamples
        .filter(e => e.isSuccess)
        .filter(e => e.description.includes("secondary-care homecare"))
        .map(spec => [spec.description, spec.request, spec.response, spec.responseMatcher, spec.statusCode])

export const convertErrorCases = convertExamples.filter(e => !e.isSuccess).map(spec => [spec.description, spec.request, spec.response, spec.statusCode])
export const prepareCases = prepareExamples.filter(e => e.isSuccess).map(spec => [spec.description, spec.request, spec.response, spec.statusCode])

export const processSecondaryCareCommunityAcuteCases =
    processExamples
        .filter(e => e.isSuccess)
        .filter(e => e.description.includes("secondary-care community acute"))
        .map(spec => [spec.description, spec.request, spec.prepareResponse, spec.convertResponse, spec.statusCode])

export const processSecondaryCareCommunityRepeatDispensingCases =
    processExamples
        .filter(e => e.isSuccess)
        .filter(e => e.description.includes("secondary-care community acute"))
        .map(spec => [spec.description, spec.request, spec.prepareResponse, spec.convertResponse, spec.statusCode])

export const processSecondaryCareHomecareCases =
        processExamples
            .filter(e => e.isSuccess)
            .filter(e => e.description.includes("secondary-care community acute"))
            .map(spec => [spec.description, spec.request, spec.prepareResponse, spec.convertResponse, spec.statusCode])

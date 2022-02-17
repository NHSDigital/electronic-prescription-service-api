import {fhir} from "@models"
import {
  convertBundleToSpineRequest,
  convertParametersToSpineRequest,
  convertTaskToSpineRequest,
  convertClaimToSpineRequest
} from "../src/services/translation/request"
import {
  isBundle,
  isParameters,
  isTask,
  isClaim
} from "../src/utils/type-guards"
import {SpineRequest} from "../../models/spine"
import * as TestResources from "./resources/test-resources"
import pino from "pino"

const logger = pino()

export async function convert(request: fhir.Resource): Promise<SpineRequest> {
  // copy of convert route logic, todo: either test injecting request into endpoint
  // or refactor these checks into a testable method and remove duplication
  if (isBundle(request)) {
    return await convertBundleToSpineRequest(request, TestResources.validTestHeaders, logger)
  } else if (isParameters(request)) {
    return await convertParametersToSpineRequest(request, TestResources.validTestHeaders, logger)
  } else if (isTask(request)) {
    return await convertTaskToSpineRequest(request, TestResources.validTestHeaders, logger)
  } else if (isClaim(request)) {
    return await convertClaimToSpineRequest(request, TestResources.validTestHeaders, logger)
  }
}

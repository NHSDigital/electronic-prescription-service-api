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
  if (isBundle(request)) {
    return await convertBundleToSpineRequest(request, TestResources.validTestHeaders, logger)
  } else if (isParameters(request)) {
    return convertParametersToSpineRequest(request, TestResources.validTestHeaders)
  } else if (isTask(request)) {
    return await convertTaskToSpineRequest(request, TestResources.validTestHeaders)
  } else if (isClaim(request)) {
    return convertClaimToSpineRequest(request, TestResources.validTestHeaders)
  }
}

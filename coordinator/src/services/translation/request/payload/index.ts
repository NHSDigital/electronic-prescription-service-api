import {fhir, spine} from "@models"
import pino from "pino"
import Hapi from "@hapi/hapi"
import {PayloadFactory} from "./factory"
import * as requestBuilder from "../../../communication/ebxml-request-builder"

async function convertBundleToSpineRequest(
  bundle: fhir.Bundle,
  headers: Hapi.Util.Dictionary<string>,
  logger: pino.Logger
): Promise<spine.SpineRequest> {
  const factory = PayloadFactory.forBundle()
  const payload = factory.makeSendMessagePayload(bundle, headers, logger)
  return requestBuilder.toSpineRequest(payload, headers)
}

function convertClaimToSpineRequest(
  claim: fhir.Claim,
  headers: Hapi.Util.Dictionary<string>,
  logger: pino.Logger
): spine.SpineRequest {
  const factory = PayloadFactory.forClaim()
  const payload = factory.makeSendMessagePayload(claim, headers, logger)
  return requestBuilder.toSpineRequest(payload, headers)
}

function convertParametersToSpineRequest(
  parameters: fhir.Parameters,
  headers: Hapi.Util.Dictionary<string>,
  logger: pino.Logger
): spine.SpineRequest {
  const factory = PayloadFactory.forParameters()
  const payload = factory.makeSendMessagePayload(parameters, headers, logger)
  return requestBuilder.toSpineRequest(payload, headers)
}

function convertTaskToSpineRequest(
  task: fhir.Task,
  headers: Hapi.Util.Dictionary<string>,
  logger: pino.Logger
): spine.SpineRequest {
  const factory = PayloadFactory.forTask()
  const payload = factory.makeSendMessagePayload(task, headers, logger)
  return requestBuilder.toSpineRequest(payload, headers)
}

export {
  convertBundleToSpineRequest,
  convertClaimToSpineRequest,
  convertParametersToSpineRequest,
  convertTaskToSpineRequest
}

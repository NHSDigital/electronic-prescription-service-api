import {fhir, spine} from "@models"
import pino from "pino"
import Hapi from "@hapi/hapi"
import {SendMessagePayloadFactory} from "./factory"
import * as requestBuilder from "../../../communication/ebxml-request-builder"

async function convertBundleToSpineRequest(
  bundle: fhir.Bundle,
  headers: Hapi.Utils.Dictionary<string>,
  logger: pino.Logger
): Promise<spine.SpineRequest> {
  const factory = SendMessagePayloadFactory.forBundle()
  const payload = factory.createSendMessagePayload(bundle, headers, logger)
  return requestBuilder.toSpineRequest(payload, headers)
}

function convertClaimToSpineRequest(
  claim: fhir.Claim,
  headers: Hapi.Utils.Dictionary<string>,
  logger: pino.Logger
): spine.SpineRequest {
  const factory = SendMessagePayloadFactory.forClaim()
  const payload = factory.createSendMessagePayload(claim, headers, logger)
  return requestBuilder.toSpineRequest(payload, headers)
}

function convertParametersToSpineRequest(
  parameters: fhir.Parameters,
  headers: Hapi.Utils.Dictionary<string>,
  logger: pino.Logger
): spine.SpineRequest {
  const factory = SendMessagePayloadFactory.forParameters()
  const payload = factory.createSendMessagePayload(parameters, headers, logger)
  return requestBuilder.toSpineRequest(payload, headers)
}

function convertTaskToSpineRequest(
  task: fhir.Task,
  headers: Hapi.Utils.Dictionary<string>,
  logger: pino.Logger
): spine.SpineRequest {
  const factory = SendMessagePayloadFactory.forTask()
  const payload = factory.createSendMessagePayload(task, headers, logger)
  return requestBuilder.toSpineRequest(payload, headers)
}

export type {PayloadContent} from "./factory"

export {
  convertBundleToSpineRequest,
  convertClaimToSpineRequest,
  convertParametersToSpineRequest,
  convertTaskToSpineRequest
}

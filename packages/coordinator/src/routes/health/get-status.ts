import Hapi, {RouteDefMethods} from "@hapi/hapi"
import axios from "axios"
import {VALIDATOR_HOST} from "../util"
import {spineClient} from "../../services/communication/spine-client"
import {serviceHealthCheck, StatusCheckResponse} from "../../utils/status"
import {isEpsHostedContainer} from "../../utils/feature-flags"

function createStatusResponse(
  errorStatusCode: number,
  checks: Record<string, Array<StatusCheckResponse>>,
  h: Hapi.ResponseToolkit
) {
  let responseStatus = "pass"
  let responseCode = 200
  const allChecks = Object.values(checks).flat()
  if (allChecks.find(check => check.status === "warn")) {
    responseStatus = "warn"
    responseCode = errorStatusCode
  }
  if (allChecks.find(check => check.status === "error")) {
    responseStatus = "error"
    responseCode = errorStatusCode
  }

  return h.response({
    status: responseStatus,
    commitId: process.env.COMMIT_ID,
    versionNumber: process.env.DEPLOYED_VERSION,
    checks: checks
  }).code(responseCode)
}

export default [
  {
    method: "GET" as RouteDefMethods,
    path: "/_status",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      let validatorStatus: StatusCheckResponse
      if (isEpsHostedContainer()) {
        validatorStatus = {
          status: "pass",
          timeout: "false",
          responseCode: 200,
          outcome: "not used"
        }
      } else {
        validatorStatus = await serviceHealthCheck(`${VALIDATOR_HOST}/_status`, request.logger, undefined)
      }
      return createStatusResponse(200, {
        "validator:status": [validatorStatus],
        "spine:status": [await spineClient.getStatus(request.logger)]
      }, h)
    }
  },
  {
    method: "GET" as RouteDefMethods,
    path: "/_healthcheck",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      return createStatusResponse(500, {
        "validator:status": [await serviceHealthCheck(`${VALIDATOR_HOST}/_status`, request.logger, undefined)]
      }, h)
    }
  },
  {
    method: "GET" as RouteDefMethods,
    path: "/_validatormetrics/{path*}",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      try {
        const url = `${VALIDATOR_HOST}/actuator/metrics/${request.params.path ?? ""}${request.url.search ?? ""}`
        request.logger.info(`Getting validator metrics at ${url}`)

        const response = await axios.get<string>(url, {timeout: 2000})

        if (response.status < 400) {
          return h.response(response.data)
        } else {
          return h.response("Could not get metrics")
        }
      } catch (err) {
        request.logger.error(`Got error when making request for validator metrics: ${err}`)
      }
    }
  }
]

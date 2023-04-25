import Hapi from "@hapi/hapi"

import {getPayloadIdentifiersFromLogs, hasAuditTag} from "./helpers"
import {isAuditPayloadHash, isPrepareEndpointResponse} from "./types"
import {PayloadIdentifiersValidator} from "./validation"
import {getSHA256PrepareEnabled} from "../../src/utils/feature-flags"

const SHA1_HASH_LENGTH = 40
const SHA256_HASH_LENGTH = 64

/**
 * Expects that the hash for incoming payloads is logged.
 * @param logs - the logs produced for a request to the API
 */
const expectPayloadAuditLogs = (
  logs: Array<Hapi.RequestLog>,
  path: string,
  expectedUseSHA256 = false
): void => {
  let hasLoggedPayloadHash = false

  logs.forEach((log) => {
    // Check that payload hash is logged with an audit log
    if (isAuditPayloadHash(log.data)) {
      hasLoggedPayloadHash = true
      expect(hasAuditTag(log)).toBeTruthy()

      const isPreparePath = path === "/$prepare"
      const useSHA256 = getSHA256PrepareEnabled() && isPreparePath
      expect(useSHA256).toBe(expectedUseSHA256)

      const expectedHashLength = useSHA256 ? SHA256_HASH_LENGTH : SHA1_HASH_LENGTH
      expect(log.data.incomingMessageHash).toHaveLength(expectedHashLength)
    }
  })

  expect(hasLoggedPayloadHash).toBeTruthy()
}

/**
 * AEA-2743 - Expects that identifiers within incoming payloads are logged.
 * @param logs - the logs produced for a request to the API
 * @param customValidator - an optional validator for custom validation rules (e.g. excluding fields)
 */
const expectPayloadIdentifiersAreLogged = (
  logs: Array<Hapi.RequestLog>,
  customValidator?: PayloadIdentifiersValidator
): void => {
  const identifiers = getPayloadIdentifiersFromLogs(logs)
  expect(identifiers.length).toBeGreaterThan(0) // Check at least one log message with identifiers was found

  const validator = customValidator ?? new PayloadIdentifiersValidator()
  validator.validateArray(identifiers) // Validate the array of identifiers
}

/**
 * Expects that parameters, for a request to the prepare endpoint, are logged.
 * @param logs - the logs produced for a request to the API
 */
const expectPrepareEndpointParametersAreLogged = (
  logs: Array<Hapi.RequestLog>
): void => {
  let logsFound = false

  logs.forEach((log) => {
    if (isPrepareEndpointResponse(log.data)) {
      logsFound = true
      const parameterLogMessage = log.data.PrepareEndpointResponse.parameter

      expect(parameterLogMessage).toContainObject({name: "digest"})
      expect(parameterLogMessage).toContainObject({name: "timestamp"})
      expect(parameterLogMessage).toContainObject({name: "algorithm"})
    }
  })

  expect(logsFound).toBeTruthy()
}

export {
  expectPayloadAuditLogs,
  expectPayloadIdentifiersAreLogged,
  expectPrepareEndpointParametersAreLogged
}

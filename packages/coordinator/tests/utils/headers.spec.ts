import {
  getRequestId,
  getCorrelationId,
  getAsid,
  getPartyKey,
  getSdsUserUniqueId,
  getSdsRoleProfileId,
  getScope,
  getShowValidationWarnings,
  DEFAULT_SCOPE,
  AWS_SCOPE,
  getProxyName,
  ProxyName
} from "../../src/utils/headers"
import {validTestHeaders, validTestHeadersWithoutAsidPartyKey} from "../resources/test-resources"

const guidRegex = /^[0-9a-f]{8}[-]?(?:[0-9a-f]{4}[-]?){3}[0-9a-f]{12}$/
describe("header functions do the right thing", () => {

  test("getRequestId gets correct value when not sandbox", () => {
    process.env.SANDBOX = "0"
    const requestId = getRequestId(validTestHeaders)
    expect(requestId).toBe("TEST")
  })

  test("getRequestId gets correct value when is sandbox", () => {
    process.env.SANDBOX = "1"
    const requestId = getRequestId(validTestHeaders)
    expect(requestId).toMatch(guidRegex)
  })

  test("getCorrelationId gets correct value when not sandbox", () => {
    process.env.SANDBOX = "0"
    const correlationId = getCorrelationId(validTestHeaders)
    expect(correlationId).toBe("TEST-CORRELATION-ID")
  })

  test("getCorrelationId gets correct value when is sandbox", () => {
    process.env.SANDBOX = "1"
    const correlationId = getCorrelationId(validTestHeaders)
    expect(correlationId).toMatch(guidRegex)
  })

  test("getAsid gets correct value when not sandbox", () => {
    process.env.SANDBOX = "0"
    const newHeaders = validTestHeaders
    newHeaders["nhsd-asid"] = "new-asid"
    const asid = getAsid(newHeaders)
    expect(asid).toBe("new-asid")
  })

  test("getAsid gets correct value when is sandbox", () => {
    process.env.SANDBOX = "1"
    const asid = getAsid(validTestHeaders)
    expect(asid).toBe("200000001285")
  })

  test("getAsid gets correct value when not in sandbox but in PTL hosted container", () => {
    process.env.SANDBOX = "0"
    process.env.MTLS_SPINE_CLIENT = "true"
    process.env.ENABLE_DEFAULT_ASID_PARTY_KEY = "true"
    const asid = getAsid(validTestHeadersWithoutAsidPartyKey)
    expect(asid).toBe("DEFAULT_PTL_ASID")
  })

  test("getAsid throws error when it can not get asid", () => {
    process.env.SANDBOX = "0"
    process.env.MTLS_SPINE_CLIENT = "true"
    process.env.ENABLE_DEFAULT_ASID_PARTY_KEY = "false"
    expect(() => {
      getAsid(validTestHeadersWithoutAsidPartyKey)
    }).toThrow(new Error("Could not get ASID"))
  })

  test("getPartyKey gets correct value when not sandbox", () => {
    process.env.SANDBOX = "0"
    const partyKey = getPartyKey(validTestHeaders)
    expect(partyKey).toBe("T141D-822234")
  })

  test("getPartyKey gets correct value when is sandbox", () => {
    process.env.SANDBOX = "1"
    const partyKey = getPartyKey(validTestHeaders)
    expect(partyKey).toBe("DEFAULT_SANDBOX_PARTY_KEY")
  })

  test("getPartyKey gets correct value when not in sandbox but in PTL hosted container", () => {
    process.env.SANDBOX = "0"
    process.env.MTLS_SPINE_CLIENT = "true"
    process.env.ENABLE_DEFAULT_ASID_PARTY_KEY = "true"
    const asid = getPartyKey(validTestHeadersWithoutAsidPartyKey)
    expect(asid).toBe("DEFAULT_PTL_PARTY_KEY")
  })

  test("getPartyKey throws error when it can not get party key", () => {
    process.env.SANDBOX = "0"
    process.env.MTLS_SPINE_CLIENT = "true"
    process.env.ENABLE_DEFAULT_ASID_PARTY_KEY = "false"
    expect(() => {
      getPartyKey(validTestHeadersWithoutAsidPartyKey)
    }).toThrow(new Error("Could not get party key"))
  })

  test("getSdsUserUniqueId gets correct value when not sandbox", () => {
    process.env.SANDBOX = "0"
    const newHeaders = validTestHeaders
    newHeaders["nhsd-identity-uuid"] = "new-identity-uuid"
    const sdsUserUniqueId = getSdsUserUniqueId(validTestHeaders)
    expect(sdsUserUniqueId).toBe("new-identity-uuid")
  })

  test("getSdsUserUniqueId gets correct value when is sandbox", () => {
    process.env.SANDBOX = "1"
    const sdsUserUniqueId = getSdsUserUniqueId(validTestHeaders)
    expect(sdsUserUniqueId).toBe("555254239107")
  })

  test("getSdsRoleProfileId gets correct value when not sandbox", () => {
    process.env.SANDBOX = "0"
    const newHeaders = validTestHeaders
    newHeaders["nhsd-session-urid"] = "new-session-urid"
    const sdsUserUniqueId = getSdsRoleProfileId(validTestHeaders)
    expect(sdsUserUniqueId).toBe("new-session-urid")
  })

  test("getSdsRoleProfileId gets correct value when is sandbox", () => {
    process.env.SANDBOX = "1"
    const sdsRoleProfileId = getSdsRoleProfileId(validTestHeaders)
    expect(sdsRoleProfileId).toBe("555254240100")
  })

  test("getScope gets correct value when not sandbox", () => {
    process.env.SANDBOX = "0"
    process.env.MTLS_SPINE_CLIENT = "false"
    const newHeaders = validTestHeaders
    newHeaders["nhsd-scope"] = "scope1 scope2"
    const scope = getScope(validTestHeaders)
    expect(scope).toBe("scope1 scope2")
  })

  test("getScope gets correct value when is sandbox", () => {
    process.env.SANDBOX = "1"
    process.env.MTLS_SPINE_CLIENT = "false"
    const scope = getScope(validTestHeaders)
    expect(scope).toBe(DEFAULT_SCOPE)
  })

  test("getScope gets correct value when is in EPS hosted", () => {
    process.env.MTLS_SPINE_CLIENT = "true"
    const scope = getScope(validTestHeaders)
    expect(scope).toBe(AWS_SCOPE)
  })

  test("getShowValidationWarnings gets correct value when not sandbox", () => {
    process.env.SANDBOX = "0"
    const newHeaders = validTestHeaders
    newHeaders["x-show-validation-warnings"] = "true"
    const showValidationWarnings = getShowValidationWarnings(validTestHeaders)
    expect(showValidationWarnings).toBe("true")
  })

  test("getShowValidationWarnings gets correct value when is sandbox", () => {
    process.env.SANDBOX = "1"
    const showValidationWarnings = getShowValidationWarnings(validTestHeaders)
    expect(showValidationWarnings).toBe("false")
  })

  const getProxyNameTestCases = [
    {
      "proxyHeaderValue": "fhir-dispensing--internal-dev--fhir-dispensing-pr-3094",
      "isEpsHostedContainer": "true",
      "expectedValue": ProxyName.EPS_FHIR_DISPENSING
    },
    {
      "proxyHeaderValue": "fhir-dispensing--internal-dev--fhir-dispensing",
      "isEpsHostedContainer": "true",
      "expectedValue": ProxyName.EPS_FHIR_DISPENSING
    },
    {
      "proxyHeaderValue": "fhir-prescribing--internal-dev--fhir-prescribing-pr-3094",
      "isEpsHostedContainer": "true",
      "expectedValue": ProxyName.EPS_FHIR_PRESCRIBING
    },
    {
      "proxyHeaderValue": "fhir-prescribing--internal-dev--fhir-prescribing",
      "isEpsHostedContainer": "true",
      "expectedValue": ProxyName.EPS_FHIR_PRESCRIBING
    },
    {
      "proxyHeaderValue": null,
      "isEpsHostedContainer": "true",
      "expectedValue": ProxyName.EPS_FHIR_DISPENSING
    },
    {
      "proxyHeaderValue": "fhir-prescribing--internal-dev--fhir-prescribing",
      "isEpsHostedContainer": "false",
      "expectedValue": ProxyName.EPS_FHIR
    }
  ]

  test.each(getProxyNameTestCases)(
    // eslint-disable-next-line max-len
    "getProxyName returns $expectedValue when isEpsHostedContainer set to $isEpsHostedContainer and proxyHeaderValue set to $proxyHeaderValue",
    function (testCase) {
      process.env.MTLS_SPINE_CLIENT = testCase.isEpsHostedContainer
      const proxyHeader = {
        "apiproxy": testCase.proxyHeaderValue
      }
      const proxyName = getProxyName(proxyHeader)
      expect(proxyName).toBe(testCase.expectedValue)

    })
})

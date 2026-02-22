import {
  callFhirValidator,
  ContentTypes,
  filterValidatorResponse,
  getPayload,
  handleResponse,
  VALIDATOR_HOST
} from "../../src/routes/util"
import {clone} from "../resources/test-helpers"
import * as TestResources from "../resources/test-resources"
import {getMessageHeader} from "../../src/services/translation/common/getResourcesOfType"
import axios from "axios"
import MockAdapter from "axios-mock-adapter"
import {fhir, spine} from "@models"
import {identifyMessageType} from "../../src/services/translation/common"
import * as Hapi from "@hapi/hapi"
import * as HapiShot from "@hapi/shot"

jest.mock("../../src/services/translation/response", () => ({
  translateToFhir: () => ({statusCode: 200, fhirResponse: {value: "some FHIR response"}})
}))

const mock = new MockAdapter(axios)

describe("forward header", ()=> {
  afterEach(() => {
    mock.reset()
  })

  test("API only forwards valid headers to validator", async () => {
    mock.onPost(`${VALIDATOR_HOST}/$validate`).reply(200, {resourceType: "OperationOutcome"})

    const exampleHeaders = {
      accept: "application/json+fhir",
      "content-type": "application/my-content-type",
      "x-request-id": "my_x_request_id",
      "x-amzn-trace-id": "my_x_amzn_trace_id",
      "nhsd-correlation-id": "my_nhsd_correlation_id",
      "nhsd-request-id": "my_nhsd_request_id"
    }

    await callFhirValidator("data", exampleHeaders)
    const requestHeaders = mock.history.post[0].headers
    expect(requestHeaders["Accept"]).not.toBe("application/json+fhir")
    expect(requestHeaders["Content-Type"]).toBe("application/my-content-type")
    expect(requestHeaders["x-request-id"]).toBe("my_x_request_id")
    expect(requestHeaders["x-amzn-trace-id"]).toBe("my_x_amzn_trace_id")
    expect(requestHeaders["nhsd-correlation-id"]).toBe("my_nhsd_correlation_id")
    expect(requestHeaders["nhsd-request-id"]).toBe("my_nhsd_request_id")
  })

  test("API forwards nhsd-request-id header as x-request-id to validator", async () => {
    mock.onPost(`${VALIDATOR_HOST}/$validate`).reply(200, {resourceType: "OperationOutcome"})

    const exampleHeaders = {
      accept: "application/json+fhir",
      "nhsd-request-id": "my_nhsd_request_id"
    }

    await callFhirValidator("data", exampleHeaders)
    const requestHeaders = mock.history.post[0].headers
    expect(requestHeaders["Accept"]).not.toBe("application/json+fhir")
    expect(requestHeaders["x-request-id"]).toBe("my_nhsd_request_id")
  })
})

describe("identifyMessageType", () => {
  let bundle: fhir.Bundle
  let messageHeader: fhir.MessageHeader

  beforeEach(() => {
    bundle = clone(TestResources.specification[0].fhirMessageUnsigned)
    messageHeader = getMessageHeader(bundle)
  })

  test("identifies a prescription message correctly", () => {
    const messageType = fhir.EventCodingCode.PRESCRIPTION
    messageHeader.eventCoding.code = messageType
    expect(identifyMessageType(bundle)).toBe(messageType)
  })
})

function createRoute<T>(spineResponse: spine.SpineDirectResponse<T> | spine.SpinePollableResponse): Hapi.ServerRoute {
  return {
    method: "POST",
    path: "/test",
    handler: async (request, responseToolkit) => {
      return await handleResponse(request, spineResponse, responseToolkit)
    }
  }
}

function createRouteOptions<T>(
  spineResponse: spine.SpineDirectResponse<T> | spine.SpinePollableResponse,
  headers?: HapiShot.RequestOptions["headers"]
) {
  return {
    method: "POST",
    url: "/test",
    headers: headers,
    payload: spineResponse
  }
}

describe("handleResponse", () => {
  let server: Hapi.Server

  beforeEach(async () => {
    server = Hapi.server()
  })

  afterEach(async () => {
    await server.stop()
  })

  test("pollable response", async () => {
    const spineResponse: spine.SpinePollableResponse = {
      pollingUrl: "testUrl",
      statusCode: 202
    }

    server.route([createRoute(spineResponse)])

    const response = await server.inject(createRouteOptions(spineResponse))

    expect(response.headers["content-location"]).toBe("testUrl")
  })

  test("operationOutcome response", async () => {
    const operationOutcome: fhir.OperationOutcome = {
      resourceType: "OperationOutcome",
      issue: []
    }
    const spineResponse: spine.SpineDirectResponse<fhir.OperationOutcome> = {
      body: operationOutcome,
      statusCode: 200
    }

    server.route([createRoute(spineResponse)])

    const response = await server.inject(createRouteOptions(spineResponse))

    expect(JSON.parse(response.payload)).toEqual(operationOutcome)
    expect(response.headers["content-type"]).toEqual(ContentTypes.FHIR)
  })

  test("bundle response", async () => {
    const bundle: fhir.Bundle = {
      resourceType: "Bundle",
      entry: []
    }
    const spineResponse: spine.SpineDirectResponse<fhir.Bundle> = {
      body: bundle,
      statusCode: 200
    }

    server.route([createRoute(spineResponse)])

    const response = await server.inject(createRouteOptions(spineResponse))

    expect(JSON.parse(response.payload)).toEqual(bundle)
    expect(response.headers["content-type"]).toEqual(ContentTypes.FHIR)
  })

  test("xml response", async () => {
    const spineResponse: spine.SpineDirectResponse<string> = {
      body: "some xml response",
      statusCode: 200
    }

    server.route([createRoute(spineResponse)])

    const response = await server.inject(createRouteOptions(spineResponse, {"X-Raw-Response": "true"}))

    expect(response.payload).toEqual("some xml response")
    expect(response.headers["content-type"]).toEqual(ContentTypes.XML)
  })

  test("fhir response", async () => {
    const spineResponse: spine.SpineDirectResponse<string> = {
      body: "some xml response",
      statusCode: 200
    }

    server.route([createRoute(spineResponse)])

    const response = await server.inject(createRouteOptions(spineResponse))

    expect(JSON.parse(response.payload)).toEqual({value: "some FHIR response"})
    expect(response.headers["content-type"]).toEqual(ContentTypes.FHIR)
  })
})

describe("filterValidatorResponse", () => {
  test("returns errors if present", () => {
    const validatorResponse: fhir.OperationOutcome = {
      resourceType: "OperationOutcome",
      issue: [
        {
          code: undefined,
          severity: "error"
        }
      ]
    }
    expect(filterValidatorResponse(validatorResponse, false).issue).toHaveLength(1)
  })

  test("returns empty if no errors", () => {
    const validatorResponse: fhir.OperationOutcome = {
      resourceType: "OperationOutcome",
      issue: [
        {
          code: undefined,
          severity: "warning"
        }
      ]
    }
    expect(filterValidatorResponse(validatorResponse, false).issue).toHaveLength(0)
  })

  test("ignores errors that have nhsNumberVerification", () => {
    const validatorResponse: fhir.OperationOutcome = {
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "error",
          code: fhir.IssueCodes.PROCESSING,

          diagnostics:
            "None of the codes provided are in the value set " +
            "https://fhir.hl7.org.uk/ValueSet/UKCore-NHSNumberVerificationStatus " +
            "(https://fhir.hl7.org.uk/ValueSet/UKCore-NHSNumberVerificationStatus), " +
            "and a code from this value set is required) " +
            "(codes = https://fhir.hl7.org.uk/CodeSystem/UKCore-NHSNumberVerificationStatus#01)"
        },
        {
          severity: "error",
          code: fhir.IssueCodes.PROCESSING,

          diagnostics:
            "Unknown code 'https://fhir.hl7.org.uk/CodeSystem/UKCore-NHSNumberVerificationStatus#01' for " +
            "'https://fhir.hl7.org.uk/CodeSystem/UKCore-NHSNumberVerificationStatus#01'"
        }
      ]
    }
    expect(filterValidatorResponse(validatorResponse, false).issue).toHaveLength(0)
  })
})

describe("CodeSystem URL normalization", () => {
  let server: Hapi.Server
  const loggerInfoSpy = jest.fn()

  beforeEach(async () => {
    server = Hapi.server({
      routes: {
        payload: {
          parse: false
        }
      }
    })
    // Mock logger on server
    server.decorate("request", "logger", {
      info: loggerInfoSpy,
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    })
    loggerInfoSpy.mockClear()
  })

  afterEach(async () => {
    await server.stop()
  })

  test("normalises https CodeSystem URLs to http during payload parsing", async () => {
    const payloadWithHttps = JSON.stringify({
      resourceType: "Claim",
      type: {
        coding: [
          {
            system: "https://terminology.hl7.org/CodeSystem/claim-type",
            code: "pharmacy",
            display: "Pharmacy"
          }
        ]
      },
      priority: {
        coding: [
          {
            system: "https://terminology.hl7.org/CodeSystem/processpriority",
            code: "normal"
          }
        ]
      }
    })

    server.route({
      method: "POST",
      path: "/test",
      handler: async (request) => {
        const payload = await getPayload(request)
        return payload
      }
    })

    const response = await server.inject({
      method: "POST",
      url: "/test",
      headers: {
        "x-request-id": "test-id",
        "content-type": "application/fhir+json"
      },
      payload: payloadWithHttps
    })

    const parsedResponse = JSON.parse(response.payload)
    expect(parsedResponse.type.coding[0].system).toBe("http://terminology.hl7.org/CodeSystem/claim-type") // NOSONAR
    expect(parsedResponse.priority.coding[0].system)
      .toBe("http://terminology.hl7.org/CodeSystem/processpriority") // NOSONAR

    // Verify that normalization was logged
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        originalUrl: "https://terminology.hl7.org/CodeSystem/claim-type",
        normalisedUrl: "http://terminology.hl7.org/CodeSystem/claim-type" // NOSONAR
      }),
      "Normalizing HL7 URIs from https to http"
    )
  })

  test("leaves http CodeSystem URLs unchanged", async () => {
    const payloadWithHttp = JSON.stringify({
      resourceType: "Claim",
      type: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/claim-type", // NOSONAR
            code: "pharmacy"
          }
        ]
      }
    })

    server.route({
      method: "POST",
      path: "/test",
      handler: async (request) => {
        const payload = await getPayload(request)
        return payload
      }
    })

    const response = await server.inject({
      method: "POST",
      url: "/test",
      headers: {
        "x-request-id": "test-id",
        "content-type": "application/fhir+json"
      },
      payload: payloadWithHttp
    })

    const parsedResponse = JSON.parse(response.payload)
    expect(parsedResponse.type.coding[0].system).toBe("http://terminology.hl7.org/CodeSystem/claim-type") // NOSONAR

    // Verify that no normalization was logged (since URL already http)
    const normalizationCalls = loggerInfoSpy.mock.calls.filter(call =>
      call[1] === "Normalizing HL7 URIs from https to http"
    )
    expect(normalizationCalls).toHaveLength(0)
  })

  test("only normalises terminology.hl7.org CodeSystem URLs", async () => {
    const payloadWithMixedUrls = JSON.stringify({
      resourceType: "Claim",
      type: {
        coding: [
          {
            system: "https://terminology.hl7.org/CodeSystem/claim-type",
            code: "pharmacy"
          }
        ]
      },
      extension: [
        {
          url: "https://fhir.nhs.uk/StructureDefinition/Extension-other",
          valueString: "some value"
        }
      ]
    })

    server.route({
      method: "POST",
      path: "/test",
      handler: async (request) => {
        const payload = await getPayload(request)
        return payload
      }
    })

    const response = await server.inject({
      method: "POST",
      url: "/test",
      headers: {
        "x-request-id": "test-id",
        "content-type": "application/fhir+json"
      },
      payload: payloadWithMixedUrls
    })

    const parsedResponse = JSON.parse(response.payload)
    expect(parsedResponse.type.coding[0].system).toBe("http://terminology.hl7.org/CodeSystem/claim-type") // NOSONAR
    expect(parsedResponse.extension[0].url).toBe("https://fhir.nhs.uk/StructureDefinition/Extension-other")
  })

  test("handles Buffer payloads with https CodeSystem URLs", async () => {
    const payloadWithHttps = {
      resourceType: "Claim",
      type: {
        coding: [
          {
            system: "https://terminology.hl7.org/CodeSystem/claim-type",
            code: "pharmacy"
          }
        ]
      }
    }

    server.route({
      method: "POST",
      path: "/test",
      handler: async (request) => {
        const payload = await getPayload(request)
        return payload
      }
    })

    const response = await server.inject({
      method: "POST",
      url: "/test",
      headers: {
        "x-request-id": "test-id",
        "content-type": "application/fhir+json"
      },
      payload: Buffer.from(JSON.stringify(payloadWithHttps))
    })

    const parsedResponse = JSON.parse(response.payload)
    expect(parsedResponse.type.coding[0].system).toBe("http://terminology.hl7.org/CodeSystem/claim-type") // NOSONAR
  })
})

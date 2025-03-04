import Hapi from "@hapi/hapi"
import * as HapiShot from "@hapi/shot"
import * as Headers from "../src/utils/headers"
import {RequestHeaders} from "../src/utils/headers"
import {isProd} from "../src/utils/environment"
import {InconsistentValuesError, InvalidValueError} from "../../models/errors/processing-errors"
import {ContentTypes} from "../src/routes/util"
import {
  fatalResponse,
  invalidProdHeaders,
  reformatUserErrorsToFhir,
  rejectInvalidProdHeaders,
  switchContentTypeForSmokeTest
} from "../src/utils/server-extensions"
import {isEpsHostedContainer} from "../src/utils/feature-flags"
import HapiPino from "hapi-pino"
import pino, {DestinationStream} from "pino"
import split from "split2"

jest.mock("../src/utils/environment", () => ({
  isProd: jest.fn(),
  isEpsHostedContainer: jest.fn()
}))

jest.mock("../src/utils/feature-flags", () => ({
  isEpsHostedContainer: jest.fn(),
  isSandbox: jest.fn(() => false)
}))

const newIsProd = isProd as jest.MockedFunction<typeof isProd>
const newIsEpsHostedContainer = isEpsHostedContainer as jest.MockedFunction<typeof isEpsHostedContainer>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sink(spyFunc: (...args: Array<any>) => void) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = split((data: any) => {
    try {
      return JSON.parse(data)
    } catch (err) {
      console.log(err)
      console.log(data)
    }
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result.on("data", (data: any) => spyFunc(data))
  return result
}

const spyOnPinoOutput = jest.fn()
const spyStream: DestinationStream = sink(spyOnPinoOutput)

const logger = pino(spyStream)

const successRoute: Hapi.ServerRoute = {
  method: "GET",
  path: "/test",
  handler: (_, responseToolkit) => {
    return responseToolkit.response("success")
  }
}

const processingErrorRoute: Hapi.ServerRoute = {
  method: "GET",
  path: "/processing-error",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: (_, h) => {
    throw new InvalidValueError("")
  }
}

const processingErrorRoutePost: Hapi.ServerRoute = {
  method: "POST",
  path: "/processing-error",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: (_, h) => {
    throw new InvalidValueError("")
  }
}
const otherErrorRoute: Hapi.ServerRoute = {
  method: "GET",
  path: "/other-error",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: (_, h) => {
    throw new Error("")
  }
}

const otherErrorRoutePost: Hapi.ServerRoute = {
  method: "POST",
  path: "/other-error",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: (_, h) => {
    throw new Error("")
  }
}

const inconsistentValueErrorRoutePost: Hapi.ServerRoute = {
  method: "POST",
  path: "/inconsistentValue-error",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: (_, h) => {
    throw new InconsistentValuesError("")
  }
}

const warningRoutePost: Hapi.ServerRoute = {
  method: "POST",
  path: "/warning",
  handler: (_, responseToolkit) => {
    return responseToolkit.response("warning - OperationOutcome").code(400).type(ContentTypes.FHIR)
  }
}
const fhirRoute: Hapi.ServerRoute = {
  method: "GET",
  path: "/fhir",
  handler: (_, responseToolkit) => {
    return responseToolkit.response("success").type(ContentTypes.FHIR)
  }
}

const xmlRoute: Hapi.ServerRoute = {
  method: "GET",
  path: "/xml",
  handler: (_, responseToolkit) => {
    return responseToolkit.response("success").type(ContentTypes.XML)
  }
}

describe("rejectInvalidProdHeaders extension", () => {
  const server = Hapi.server()
  server.route([successRoute])

  beforeAll(async () => {
    await HapiPino.register(server, {
      instance: logger
    })
    server.ext("onRequest", rejectInvalidProdHeaders)
  })

  beforeEach(() => {
    newIsEpsHostedContainer.mockImplementation(() => false)
  })

  test.each(invalidProdHeaders)(
    "blocks %p header in prod", async (invalidHeader: Headers.RequestHeaders) => {
      newIsProd.mockImplementation(() => true)
      const newHeaders: HapiShot.RequestOptions["headers"] = {}
      newHeaders[invalidHeader] = "true"
      const response = await server.inject({
        method: "GET",
        url: "/test",
        headers: newHeaders
      })

      expect(response.statusCode).toBe(403)
    })

  test("allows request no invalid headers in prod", async () => {
    newIsProd.mockImplementation(() => true)
    const response = await server.inject({
      method: "GET",
      url: "/test"
    })

    expect(response.statusCode).toBe(200)
  })

  test.each(invalidProdHeaders)(
    "doesn't block %p header in non-prod", async (invalidHeader: Headers.RequestHeaders) => {
      newIsProd.mockImplementation(() => false)
      const response = await server.inject({
        method: "GET",
        url: "/test",
        headers: {invalidHeader}
      })

      expect(response.statusCode).toBe(200)
    })
})

describe("reformatUserErrorsToFhir extension", () => {
  const server = Hapi.server()

  server.route([successRoute, processingErrorRoute, otherErrorRoute])

  beforeAll(async () => {
    await HapiPino.register(server, {
      instance: logger
    })
    server.ext("onPreResponse", reformatUserErrorsToFhir)
  })

  beforeEach(() => {
    spyOnPinoOutput.mockReset()
    newIsEpsHostedContainer.mockImplementation(() => false)
  })

  test("formats processing errors", async () => {
    const response = await server.inject({url: "/processing-error"})
    expect(response.payload).toContain("OperationOutcome")
    expect(response.statusCode).toBe(400)
    expect(response.headers["content-type"]).toBe(ContentTypes.FHIR)
  })

  test("doesn't change non-errors", async () => {
    const response = await server.inject({url: "/test"})
    expect(response.payload).toBe("success")
    expect(response.statusCode).toBe(200)
  })

  test("returns valid FHIR for other errors", async () => {
    const response = await server.inject({url: "/other-error"})
    expect(response.payload).toBe(JSON.stringify(fatalResponse))
    expect(response.statusCode).toBe(500)
  })
})

describe("switchContentTypeForSmokeTest extension", () => {
  const server = Hapi.server()

  server.route([fhirRoute, xmlRoute])

  beforeAll(async () => {
    await HapiPino.register(server, {
      instance: logger
    })
    server.ext("onPreResponse", switchContentTypeForSmokeTest)
  })

  beforeEach(() => {
    spyOnPinoOutput.mockReset()
    newIsEpsHostedContainer.mockImplementation(() => false)
  })

  test("updates FHIR responses", async () => {
    const requestHeaders: Hapi.Utils.Dictionary<string> = {}
    requestHeaders[RequestHeaders.SMOKE_TEST] = "true"
    const response = await server.inject({url: "/fhir", headers: requestHeaders})
    expect(response.headers["content-type"]).toContain(ContentTypes.JSON)
  })

  test("updates xml responses", async () => {
    const requestHeaders: Hapi.Utils.Dictionary<string> = {}
    requestHeaders[RequestHeaders.SMOKE_TEST] = "true"
    const response = await server.inject({url: "/xml", headers: requestHeaders})
    expect(response.headers["content-type"]).toContain(ContentTypes.PLAIN_TEXT)
  })

  test("ignores requests without appropriate header", async () => {
    const fhirResponse = await server.inject({url: "/fhir"})
    const xmlResponse = await server.inject({url: "/xml"})
    expect(fhirResponse.headers["content-type"]).toContain(ContentTypes.FHIR)
    expect(xmlResponse.headers["content-type"]).toContain(ContentTypes.XML)
  })
})

describe("logs payload in correct situations", () => {
  const server = Hapi.server()

  server.route([
    successRoute,
    processingErrorRoutePost,
    processingErrorRoute,
    otherErrorRoutePost,
    inconsistentValueErrorRoutePost,
    warningRoutePost
  ])

  beforeAll(async () => {
    await HapiPino.register(server, {
      instance: logger
    })

    server.ext("onPreResponse", reformatUserErrorsToFhir)
  })

  beforeEach(() => {
    spyOnPinoOutput.mockReset()
  })

  const logTestCases = [
    {
      isEpsDeployment: true,
      url: "/processing-error",
      method: "POST",
      expectedMessage: "FhirMessageProcessingError",
      expectedLevel: 40,
      expectedReturnStatus: 400,
      scenarioDescription: "logs correct details for processing error when is EpsDeployment"
    },
    {
      isEpsDeployment: false,
      url: "/processing-error",
      method: "POST",
      expectedMessage: "FhirMessageProcessingError",
      expectedLevel: 40,
      expectedReturnStatus: 400,
      scenarioDescription: "logs correct details for processing error when is not EpsDeployment"
    },
    {
      isEpsDeployment: true,
      url: "/inconsistentValue-error",
      method: "POST",
      expectedMessage: "InconsistentValuesError",
      expectedLevel: 40,
      expectedReturnStatus: 400,
      scenarioDescription: "logs correct details for inconsistent value error when is EpsDeployment"
    },
    {
      isEpsDeployment: false,
      url: "/inconsistentValue-error",
      method: "POST",
      expectedMessage: "InconsistentValuesError",
      expectedLevel: 40,
      expectedReturnStatus: 400,
      scenarioDescription: "logs correct details for inconsistent value error when is not EpsDeployment"
    },

    {
      isEpsDeployment: true,
      url: "/other-error",
      method: "POST",
      expectedMessage: "Boom",
      expectedLevel: 50,
      expectedReturnStatus: 500,
      scenarioDescription: "logs correct details for other error when is EpsDeployment"
    },
    {
      isEpsDeployment: false,
      url: "/other-error",
      method: "POST",
      expectedMessage: "Boom",
      expectedLevel: 50,
      expectedReturnStatus: 500,
      scenarioDescription: "logs correct details for other error when is not EpsDeployment"
    },

    {
      isEpsDeployment: true,
      url: "/warning",
      method: "POST",
      expectedMessage: "ErrorOrWarningResponse",
      expectedLevel: 40,
      expectedReturnStatus: 400,
      scenarioDescription: "logs correct details for warning when is EpsDeployment"
    },
    {
      isEpsDeployment: false,
      url: "/warning",
      method: "POST",
      expectedMessage: "ErrorOrWarningResponse",
      expectedLevel: 40,
      expectedReturnStatus: 400,
      scenarioDescription: "logs correct details for warning when is not EpsDeployment"
    }

  ]

  test.each(logTestCases)(
    "$scenarioDescription", async function(logTestCase) {
      newIsEpsHostedContainer.mockImplementation(() => logTestCase.isEpsDeployment)
      const expectedPayload = {"foo": "bar"}
      const response = await server.inject({
        url: logTestCase.url,
        payload: {foo: "bar"},
        method: logTestCase.method
      })
      expect(response.payload).toContain("OperationOutcome")
      expect(response.statusCode).toBe(logTestCase.expectedReturnStatus)
      expect(response.headers["content-type"]).toBe(ContentTypes.FHIR)
      expect(spyOnPinoOutput).toHaveBeenCalledWith(expect.objectContaining(
        {
          "level": logTestCase.expectedLevel,
          "msg": logTestCase.expectedMessage,
          "payload": expectedPayload
        }
      ))
    }
  )

  test.each([true, false])(
    "does not log on success when isEpsDeployment is set to %p",
    async (isEpsDeploymentValue: boolean) => {
      newIsEpsHostedContainer.mockImplementation(() => isEpsDeploymentValue)
      const response = await server.inject({url: "/test"})
      expect(response.payload).toBe("success")
      expect(response.statusCode).toBe(200)
      expect(spyOnPinoOutput).not.toHaveBeenCalledWith(
        expect.objectContaining({
          "level": 40
        }))
    }
  )

  test("does not break when there is no payload", async () => {
    newIsEpsHostedContainer.mockImplementation(() => true)
    const response = await server.inject({
      url: "/processing-error",
      method: "GET"
    })
    expect(response.payload).toContain("OperationOutcome")
    expect(response.statusCode).toBe(400)
    expect(response.headers["content-type"]).toBe(ContentTypes.FHIR)
    expect(spyOnPinoOutput).toHaveBeenCalledWith(expect.objectContaining(
      {
        "level": 40,
        "msg": "FhirMessageProcessingError",
        "payload": {}
      }
    ))
  })
})

import Hapi from "@hapi/hapi"
import * as HapiShot from "@hapi/shot"
import * as Headers from "../src/utils/headers"
import {RequestHeaders} from "../src/utils/headers"
import {isProd} from "../src/utils/environment"
import {InconsistentValuesError, InvalidValueError} from "../../models/errors/processing-errors"
import {ContentTypes} from "../src/routes/util"
import {
  invalidProdHeaders,
  reformatUserErrorsToFhir,
  rejectInvalidProdHeaders,
  switchContentTypeForSmokeTest
} from "../src/utils/server-extensions"
import HapiPino from "hapi-pino"

jest.mock("../src/utils/environment", () => ({
  isProd: jest.fn()
}))

const newIsProd = isProd as jest.MockedFunction<typeof isProd>

describe("rejectInvalidProdHeaders extension", () => {
  process.env.MTLS_SPINE_CLIENT = "false"
  const server = Hapi.server()
  server.route({
    method: "GET",
    path: "/test",
    handler: (_, responseToolkit) => {
      return responseToolkit.response("success")
    }
  })

  beforeAll(async () => {
    await HapiPino.register(server, {
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          minimumLevel: "info",
          levelFirst: true,
          messageFormat: true,
          timestampKey: "time",
          translateTime: true,
          singleLine: false,
          mkdir: true,
          append: true
        }
      },
      wrapSerializers: false
    })

    server.ext("onRequest", rejectInvalidProdHeaders)
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
  process.env.MTLS_SPINE_CLIENT = "false"
  const server = Hapi.server()
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
  const otherErrorRoute: Hapi.ServerRoute = {
    method: "GET",
    path: "/other-error",
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handler: (_, h) => {
      throw new Error("")
    }
  }
  server.route([successRoute, processingErrorRoute, otherErrorRoute])

  beforeAll(async () => {
    await HapiPino.register(server, {
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          minimumLevel: "info",
          levelFirst: true,
          messageFormat: true,
          timestampKey: "time",
          translateTime: true,
          singleLine: false,
          mkdir: true,
          append: true
        }
      },
      wrapSerializers: false
    })
    server.ext("onPreResponse", reformatUserErrorsToFhir)
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

  test("doesn't change other errors", async () => {
    const response = await server.inject({url: "/other-error"})
    expect(response.payload).not.toContain("OperationOutcome")
    expect(response.statusCode).toBe(500)
  })
})

describe("switchContentTypeForSmokeTest extension", () => {
  process.env.MTLS_SPINE_CLIENT = "false"
  const server = Hapi.server()
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
  server.route([fhirRoute, xmlRoute])
  server.ext("onPreResponse", switchContentTypeForSmokeTest)

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

describe("logs payload on proxygen deployed", () => {
  process.env.MTLS_SPINE_CLIENT = "true"
  const server = Hapi.server()
  const successRoute: Hapi.ServerRoute = {
    method: "GET",
    path: "/test",
    handler: (_, responseToolkit) => {
      return responseToolkit.response("success")
    }
  }
  const processingErrorRoute: Hapi.ServerRoute = {
    method: "POST",
    path: "/processing-error",
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handler: (_, h) => {
      throw new InvalidValueError("")
    }
  }
  const inconsistentValueErrorRoute: Hapi.ServerRoute = {
    method: "POST",
    path: "/inconsistentValue-error",
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handler: (_, h) => {
      throw new InconsistentValuesError("")
    }
  }
  const warningRoute: Hapi.ServerRoute = {
    method: "POST",
    path: "/warning",
    handler: (_, responseToolkit) => {
      return responseToolkit.response("warning").code(400)
    }
  }
  const otherErrorRoute: Hapi.ServerRoute = {
    method: "POST",
    path: "/other-error",
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handler: (_, h) => {
      throw new Error("")
    }
  }
  server.route([
    successRoute,
    processingErrorRoute,
    otherErrorRoute,
    inconsistentValueErrorRoute,
    warningRoute
  ])

  const loggerSpy = jest.fn()

  server.events.on({name: "request", channels: "app"}, loggerSpy)

  beforeAll(async () => {
    await HapiPino.register(server, {
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          minimumLevel: "info",
          levelFirst: true,
          messageFormat: true,
          timestampKey: "time",
          translateTime: true,
          singleLine: false,
          mkdir: true,
          append: true
        }
      },
      wrapSerializers: false,
      mergeHapiLogData: true
    })
    server.ext("onPreResponse", reformatUserErrorsToFhir)
  })

  beforeEach(() => {
    loggerSpy.mockReset()
  })

  test("logs FhirMessageProcessingError", async () => {
    const response = await server.inject({
      url: "/processing-error",
      payload: {foo: "bar"},
      method: "POST"
    })
    expect(response.payload).toContain("OperationOutcome")
    expect(response.statusCode).toBe(400)
    expect(response.headers["content-type"]).toBe(ContentTypes.FHIR)
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.anything(),
      {
        "channel": "app",
        "data": {
          "msg": "FhirMessageProcessingError",
          "payload": {
            "foo": "bar"
          }
        },
        "request": expect.anything(),
        "tags": [
          "info"
        ],
        "timestamp": expect.anything()
      },
      {"info": true}
    )
  })

  test("logs InconsistentValuesError", async () => {
    const response = await server.inject({
      url: "/inconsistentValue-error",
      payload: {foo: "bar"},
      method: "POST"
    })
    expect(response.payload).toContain("OperationOutcome")
    expect(response.statusCode).toBe(400)
    expect(response.headers["content-type"]).toBe(ContentTypes.FHIR)
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.anything(),
      {
        "channel": "app",
        "data": {
          "msg": "InconsistentValuesError",
          "payload": {
            "foo": "bar"
          }
        },
        "request": expect.anything(),
        "tags": [
          "info"
        ],
        "timestamp": expect.anything()
      },
      {"info": true}
    )
  })

  test("doesn't log on success", async () => {
    const response = await server.inject({url: "/test"})
    expect(response.payload).toBe("success")
    expect(response.statusCode).toBe(200)
    expect(loggerSpy).not.toHaveBeenCalled()
  })

  test("logs boom errors", async () => {
    const response = await server.inject({
      url: "/other-error",
      method: "POST",
      payload: {
        "foo": "bar"
      }
    })
    expect(response.payload).not.toContain("OperationOutcome")
    expect(response.statusCode).toBe(500)
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.anything(),
      {
        "channel": "app",
        "data": {
          "msg": "Boom",
          "payload": {
            "foo": "bar"
          },
          "response": expect.anything()
        },
        "request": expect.anything(),
        "tags": [
          "error"
        ],
        "timestamp": expect.anything()
      },
      {"error": true}
    )
  })

  test("logs 400 errors", async () => {
    const response = await server.inject({
      url: "/warning",
      method: "POST",
      payload: {
        "foo": "bar"
      }
    })
    expect(response.payload).not.toContain("OperationOutcome")
    expect(response.statusCode).toBe(400)
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.anything(),
      {
        "channel": "app",
        "data": {
          "msg": "ErrorOrWarningResponse",
          "payload": {
            "foo": "bar"
          },
          "response": expect.anything()
        },
        "request": expect.anything(),
        "tags": [
          "info"
        ],
        "timestamp": expect.anything()
      },
      {"info": true}
    )
  })

})

import Hapi from "@hapi/hapi"
import * as HapiShot from "@hapi/shot"
import * as Headers from "../src/services/headers"
import {RequestHeaders} from "../src/services/headers"
import {isProd} from "../src/services/environment"
import {InvalidValueError} from "../../models/errors/processing-errors"
import {ContentTypes} from "../src/routes/util"
import {
  invalidProdHeaders,
  reformatUserErrorsToFhir,
  rejectInvalidProdHeaders,
  switchContentTypeForSmokeTest
} from "../src/server-extensions"

jest.mock("../src/services/environment", () => ({
  isProd: jest.fn()
}))

const newIsProd = isProd as jest.MockedFunction<typeof isProd>

describe("rejectInvalidProdHeaders extension", () => {
  const server = Hapi.server()
  server.route({
    method: "GET",
    path: "/test",
    handler: (_, responseToolkit) => {
      return responseToolkit.response("success")
    }
  })
  server.ext("onRequest", rejectInvalidProdHeaders)

  test.each(invalidProdHeaders)(
    "blocks %p header in prod", async (invalidHeader: Headers.RequestHeaders) => {
      newIsProd.mockImplementation(() => true)
      const newHeaders: HapiShot.Headers = {}
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
  server.ext("onPreResponse", reformatUserErrorsToFhir)

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
    const requestHeaders: Hapi.Util.Dictionary<string> = {}
    requestHeaders[RequestHeaders.SMOKE_TEST] = "true"
    const response = await server.inject({url: "/fhir", headers: requestHeaders})
    expect(response.headers["content-type"]).toContain(ContentTypes.JSON)
  })

  test("updates xml responses", async () => {
    const requestHeaders: Hapi.Util.Dictionary<string> = {}
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

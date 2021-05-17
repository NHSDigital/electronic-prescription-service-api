import Hapi from "@hapi/hapi"
import * as HapiShot from "@hapi/shot"
import * as Headers from "../src/services/headers"
import {isProd} from "../src/services/environment"
import {InvalidValueError} from "../../models/errors/processing-errors"
import {CONTENT_TYPE_FHIR} from "../src/routes/util"
import {reformatUserErrorsToFhir} from "../src/server-extensions"

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
  server.ext("onRequest", Headers.rejectInvalidProdHeaders)

  test.each(Headers.invalidProdHeaders)(
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

  test.each(Headers.invalidProdHeaders)(
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
    expect(response.headers["content-type"]).toBe(CONTENT_TYPE_FHIR)
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

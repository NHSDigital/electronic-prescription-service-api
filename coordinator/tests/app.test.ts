import Hapi from "@hapi/hapi"
import * as HapiShot from "@hapi/shot"
import * as Headers from "../src/services/headers"
import {isProd} from "../src/services/environment"

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
    "blocks invalid headers in prod", async (invalidHeader: Headers.RequestHeaders) => {
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

  test("allows request with correct headers in prod", async () => {
    newIsProd.mockImplementation(() => true)
    const response = await server.inject({
      method: "GET",
      url: "/test"
    })

    expect(response.statusCode).toBe(200)
  })

  test.each(Headers.invalidProdHeaders)(
    "doesn't block headers in non-prod", async (invalidHeader: Headers.RequestHeaders) => {
      newIsProd.mockImplementation(() => false)
      const response = await server.inject({
        method: "GET",
        url: "/test",
        headers: {invalidHeader}
      })

      expect(response.statusCode).toBe(200)
    })
})

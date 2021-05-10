import Hapi from "@hapi/hapi"
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
    "blocks correct headers in prod", async (invalidHeader: Headers.RequestHeaders) => {
      newIsProd.mockImplementation(() => true)
      const response = await server.inject({
        method: "GET",
        url: "/test",
        headers: {invalidHeader}
      })

      expect(response.statusCode).toBe(403)
    })

  test.each(Headers.invalidProdHeaders)(
    "doesn't block headers in non-prod", async (invalidHeader: Headers.RequestHeaders) => {
      newIsProd.mockImplementation(() => false)
      // isProd.mockImplementation(() => false)
      const response = await server.inject({
        method: "GET",
        url: "/test",
        headers: {invalidHeader}
      })

      expect(response.statusCode).toBe(200)
    })
})

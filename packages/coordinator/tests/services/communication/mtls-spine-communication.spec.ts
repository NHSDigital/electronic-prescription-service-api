import "jest"
import MockAdapter from "axios-mock-adapter"
import axios from "axios"
import fs from "fs"
import {spine} from "@models"
import {MtlsSpineClient} from "../../../src/services/communication/mtls-spine-client"
import path from "path"
import pino from "pino"

const mock = new MockAdapter(axios)

describe("MtlsSpineClient communication", () => {
  afterEach(() => {
    mock.reset()
  })

  const requestHandler = new MtlsSpineClient(
    "localhost",
    "Prescription",
    (spineRequest: spine.SpineRequest) => `<wrap>${spineRequest.message}</wrap>`
  )

  const logger = pino()

  const mockRequest: spine.SpineRequest = {
    message: "test",
    interactionId: "test2",
    messageId: "DEAD-BEEF",
    conversationId: "DEAD-BEEF",
    fromPartyKey: "test3"
  }

  test("Successful send response returns non pollable result when spine returns pollable", async () => {
    mock.onPost().reply(202, 'statusText: "OK"', {
      "content-location": "/_poll/test-content-location"
    })
    mock.onGet().reply(200, "foo")

    const spineResponse = await requestHandler.send(mockRequest, "from_asid", logger)

    expect(spineResponse.statusCode).toBe(200)
    expect(spine.isPollable(spineResponse)).toBe(false)
  }, 10000)
  test("Unsuccessful send response returns non-pollable result", async () => {
    mock.onPost().reply(400)

    const spineResponse = await requestHandler.send(mockRequest, "from_asid", logger)

    expect(spine.isPollable(spineResponse)).toBe(false)
    expect((spineResponse as spine.SpineDirectResponse<string>).statusCode).toBe(400)
  })

  test("Async success messages returned from spine return a 200 response", async () => {
    const asyncSuccess = readFileAsString("async_success.xml")
    mock.onPost().reply(200, `statusText: "OK", responseText: ${asyncSuccess}`)

    const spineResponse = await requestHandler.send(mockRequest, "from_asid", logger)

    expect(spineResponse.statusCode).toBe(200)
    expect(spine.isDirect(spineResponse)).toBe(true)
    expect((spineResponse as spine.SpineDirectResponse<string>).body).toContain("<hl7:acknowledgement typeCode=\"AA\">")
  })

  test("Successful polling complete response returns non pollable result", async () => {
    mock.onGet().reply(200, {statusText: "OK", responseText: 'acknowledgement typeCode="AA"'})

    const spineResponse = await requestHandler.poll("test", "200000001285", logger)

    expect(spineResponse.statusCode).toBe(200)
    expect(spine.isPollable(spineResponse)).toBe(false)
  })

  test("Status response", async () => {
    mock.onGet().reply(200)

    const statusResponse = await requestHandler.getStatus(logger)

    expect(statusResponse.status).toBe("pass")
    expect(statusResponse.responseCode).toBe(200)
  })

  test("Spine communication failure returns a 500 error result", async () => {
    mock.onPost().timeout()

    const spineResponse = await requestHandler.send(mockRequest, "from_asid", logger)

    expect(spine.isPollable(spineResponse)).toBe(false)
    expect((spineResponse as spine.SpineDirectResponse<string>).statusCode).toBe(500)
  })

  test("Logs error for unsupported status response", async () => {
    const errorMessage = "Internal Server Error"
    mock.onPost().reply(500, errorMessage)

    const loggerSpy = jest.spyOn(logger, "error")
    const spineResponse = await requestHandler.send(mockRequest, "from_asid", logger)

    expect(spineResponse.statusCode).toBe(500)

    const expectedError = `Failed post request for spine client send. Error: Error: Request failed with status code 500`

    expect(loggerSpy).toHaveBeenCalledWith(expect.anything(), expect.stringContaining(expectedError))

    loggerSpy.mockRestore()
  })

  test("Logs error for polling failure", async () => {
    const path = "test-path"
    const errorMessage = "Network Error"
    mock.onGet().networkError()

    const loggerSpy = jest.spyOn(logger, "error")
    const spineResponse = await requestHandler.poll(path, "test-asid", logger)

    expect(loggerSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining(`Failed polling request for polling path ${path}. Error: Error: ${errorMessage}`)
    )

    expect(spineResponse.statusCode).toBe(500)

    loggerSpy.mockRestore()
  })
})

describe("Spine responses", () => {
  test("Messages should be correctly identified as pollable", () => {
    const message = {
      statusCode: 200,
      pollingUrl: "http://test.com"
    }

    expect(spine.isPollable(message)).toBe(true)
  })

  test("Messages should be correctly identified as non-pollable", () => {
    const message = {
      statusCode: 200,
      body: "This is a response body"
    }

    expect(spine.isPollable(message)).toBe(false)
  })
})

function readFileAsString(filename: string): string {
  return fs.readFileSync(path.join(__dirname, `../../resources/spine-responses/${filename}`), "utf-8")
}

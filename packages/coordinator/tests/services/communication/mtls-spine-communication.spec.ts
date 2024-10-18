import "jest"
import MockAdapter from "axios-mock-adapter"
import axios from "axios"
import {spine} from "@models"
import {MtlsSpineClient} from "../../../src/services/communication/mtls-spine-client"
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
    message: "<request>test</request>",
    interactionId: "testInteraction",
    messageId: "DEAD-BEEF",
    conversationId: "DEAD-BEEF",
    fromPartyKey: "test3"
  }

  test("Successful send response returns pollable result", async () => {
    mock.onPost().reply(202, 'statusText: "OK"', {
      "content-location": "/_poll/test-content-location"
    })

    const spineResponse = await requestHandler.send(mockRequest, logger)

    expect(spineResponse.statusCode).toBe(202)
    expect(spine.isPollable(spineResponse)).toBe(true)
    expect((spineResponse as spine.SpinePollableResponse).pollingUrl)
      .toBe("example.com/eps/_poll/test-content-location")
  })

  test("Unsuccessful send response returns non-pollable result", async () => {
    mock.onPost().reply(400)

    const spineResponse = await requestHandler.send(mockRequest, logger)

    expect(spine.isPollable(spineResponse)).toBe(false)
    expect((spineResponse as spine.SpineDirectResponse<string>).statusCode).toBe(400)
  })

  test("Successful polling pending response returns pollable result", async () => {
    mock.onGet().reply(202, 'statusText: "OK"', {
      "content-location": "/_poll/test-content-location"
    })

    const spineResponse = await requestHandler.poll("test", "200000001285", logger)

    expect(spineResponse.statusCode).toBe(202)
    expect(spine.isPollable(spineResponse)).toBe(true)
    expect((spineResponse as spine.SpinePollableResponse).pollingUrl)
      .toBe("example.com/eps/_poll/test-content-location")
  })

  test("Async success messages returned from spine return a 200 response", async () => {
    const asyncSuccess = "<hl7:acknowledgement typeCode=\"AA\"></hl7:acknowledgement>"
    mock.onPost().reply(200, asyncSuccess)

    const spineResponse = await requestHandler.send(mockRequest, logger)

    expect(spineResponse.statusCode).toBe(200)
    expect(spine.isDirect(spineResponse)).toBe(true)
    expect((spineResponse as spine.SpineDirectResponse<string>).body).toContain("<hl7:acknowledgement typeCode=\"AA\">")
  })

  test("Successful polling complete response returns non-pollable result", async () => {
    mock.onGet().reply(200, {statusText: "OK", responseText: '<hl7:acknowledgement typeCode="AA"/>'})

    const spineResponse = await requestHandler.poll("test", "200000001285", logger)

    expect(spineResponse.statusCode).toBe(200)
    expect(spine.isPollable(spineResponse)).toBe(false)
  })

  test("Status response", async () => {
    mock.onGet().reply(200)

    const statusResponse = await requestHandler.getStatus(logger)

    expect(statusResponse).toHaveProperty("status", "pass")
    expect(statusResponse).toHaveProperty("responseCode", 200)
  })

  test("Spine communication failure returns a 500 error result", async () => {
    mock.onPost().timeout()

    const spineResponse = await requestHandler.send(mockRequest, logger)

    expect(spine.isPollable(spineResponse)).toBe(false)
    expect((spineResponse as spine.SpineDirectResponse<string>).statusCode).toBe(500)
  })

  test("Logs error for unsupported status response", async () => {
    const errorMessage = "Internal Server Error"
    mock.onPost().reply(500, errorMessage)

    const loggerSpy = jest.spyOn(logger, "error")
    const spineResponse = await requestHandler.send(mockRequest, logger)

    expect(spineResponse.statusCode).toBe(500)

    const expectedError = `Failed post request for spine client send. Error: Error: Request failed with status code 500`

    expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining(expectedError))

    loggerSpy.mockRestore()
  })
})

describe("Spine responses", () => {
  test("Messages should be correctly identified as pollable", () => {
    const message = {
      statusCode: 202,
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

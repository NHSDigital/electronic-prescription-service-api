import "jest"
import MockAdapter from "axios-mock-adapter"
import axios from "axios"
import fs from "fs"
import {spine} from "@models"
import {MtlsSpineClient} from "../../../src/services/communication/mtls-spine-client"
import {LiveSpineClient} from "../../../src/services/communication/live-spine-client"
import path from "path"
import pino from "pino"

const mock = new MockAdapter(axios)

const mtlsRequestHandler = new MtlsSpineClient(
  "localhost",
  "Prescription",
  (spineRequest: spine.SpineRequest) => `<wrap>${spineRequest.message}</wrap>`
)

const liveSpineClientrequestHandler = new LiveSpineClient(
  "localhost",
  "Prescribe",
  (spineRequest: spine.SpineRequest) => `<wrap>${spineRequest.message}</wrap>`
)

describe.each([
  {description: "mtls request handler", requestHandler: mtlsRequestHandler},
  {description: "live spine client request handler", requestHandler: liveSpineClientrequestHandler}
])("$description communication", (testCase) => {
  const requestHandler = testCase.requestHandler
  afterEach(() => {
    mock.reset()
  })

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

  test.skip("Successful send response calls polling twice when poll result returned first", async () => {
    mock.onPost().reply(202, 'statusText: "OK"', {
      "content-location": "/_poll/test-content-location"
    })
    mock
      .onGet()
      .replyOnce(202, "foo")
      .onGet()
      .replyOnce(200, "foo")

    const loggerSpy = jest.spyOn(logger, "info")

    const spineResponse = await requestHandler.send(mockRequest, "from_asid", logger)

    expect(spineResponse.statusCode).toBe(200)
    expect(spine.isPollable(spineResponse)).toBe(false)

    const firstMessage = "First call so delay 0.5 seconds before checking result"
    const secondMessage = "Waiting 5 seconds before polling again"
    expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining(firstMessage))
    expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining(secondMessage))

    loggerSpy.mockRestore()

  }, 10000)

  test.skip("Successful send response calls polling twice when poll returns empty 200 response", async () => {
    mock.onPost().reply(202, 'statusText: "OK"', {
      "content-location": "/_poll/test-content-location"
    })
    mock
      .onGet()
      .replyOnce(200)
      .onGet()
      .replyOnce(200, "foo")

    const loggerSpy = jest.spyOn(logger, "info")

    const spineResponse = await requestHandler.send(mockRequest, "from_asid", logger)

    expect(spineResponse.statusCode).toBe(200)
    expect((spineResponse as spine.SpineDirectResponse<string>).body).toEqual("foo")
    expect(spine.isPollable(spineResponse)).toBe(false)

    const firstMessage = "First call so delay 0.5 seconds before checking result"
    const secondMessage = "Waiting 5 seconds before polling again"
    expect(loggerSpy).toHaveBeenCalledWith("Empty body returned from spine - treating as 202 response")
    expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining(firstMessage))
    expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining(secondMessage))

    loggerSpy.mockRestore()

  }, 10000)

  test("Failure response when no response after 30 seconds", async () => {
    mock.onPost().reply(202, 'statusText: "OK"', {
      "content-location": "/_poll/test-content-location"
    })
    mock
      .onGet()
      .reply(202, "foo")

    const loggerSpy = jest.spyOn(logger, "error")

    const spineResponse = await requestHandler.send(mockRequest, "from_asid", logger)

    expect(spineResponse.statusCode).toBe(500)
    expect((spineResponse as spine.SpineDirectResponse<string>).body).toEqual(
      {
        resourceType: "OperationOutcome",
        issue: [{
          code: "exception",
          severity: "error",
          details: {
            coding: [
              {
                code: "TIMEOUT",
                display: "Timeout waiting for response",
                system: "https://fhir.nhs.uk/R4/CodeSystem/Spine-ErrorOrWarningCode",
                version: "1"
              }
            ]
          }
        }]}
    )
    const expectedError = "No response to poll after 6 attempts"

    expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining(expectedError))
  }, 60000)

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

  test("Poll function returns not supported", async () => {
    mock.onGet().reply(200, {statusText: "OK", responseText: 'acknowledgement typeCode="AA"'})

    const spineResponse = await requestHandler.poll("test", "200000001285", logger)

    expect(spineResponse.statusCode).toBe(400)
    expect((spineResponse as spine.SpineDirectResponse<string>).body).toEqual(
      {
        resourceType: "OperationOutcome",
        issue: [{
          code: "informational",
          severity: "information",
          details: {
            coding: [
              {
                code: "INTERACTION_NOT_SUPPORTED",
                display: "Interaction not supported",
                system: "https://fhir.nhs.uk/R4/CodeSystem/Spine-ErrorOrWarningCode",
                version: "1"
              }
            ]
          }
        }]}
    )
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

    // eslint-disable-next-line max-len
    const expectedErrorMessage = `Failed post request for spine client send. Error: Error: Request failed with status code 500`
    const expectedError = {
      error: expect.objectContaining({
        message: "Request failed with status code 500",
        name: "Error",
        stack: expect.anything(),
        status: 500
      }),
      response: expect.objectContaining({
        data: "Internal Server Error",
        status: 500
      })
    }
    expect(loggerSpy).toHaveBeenCalledWith(expectedError, expect.stringContaining(expectedErrorMessage))

    loggerSpy.mockRestore()
  })

  test("should return error when a network error", async() => {
    mock.onPost().networkError()
    const loggerWarnSpy = jest.spyOn(logger, "warn")

    const spineResponse = await requestHandler.send(mockRequest, "from_asid", logger)

    expect(spine.isPollable(spineResponse)).toBe(false)
    expect((spineResponse as spine.SpineDirectResponse<string>).statusCode).toBe(500)
    expect(loggerWarnSpy).toHaveBeenCalledWith("Call to spine failed - retrying. Retry count 1")
    expect(loggerWarnSpy).toHaveBeenCalledWith("Call to spine failed - retrying. Retry count 2")
    expect(loggerWarnSpy).toHaveBeenCalledWith("Call to spine failed - retrying. Retry count 3")
    expect(loggerWarnSpy).not.toHaveBeenCalledWith("Call to spine failed - retrying. Retry count 4")
  })

  test("should return success when there is a network error once", async() => {
    mock.onPost()
      .networkErrorOnce()
    mock.onPost().reply(202, 'statusText: "OK"', {
      "content-location": "/_poll/test-content-location"
    })
    mock.onGet().reply(200, "foo")
    const loggerWarnSpy = jest.spyOn(logger, "warn")

    const spineResponse = await requestHandler.send(mockRequest, "from_asid", logger)

    expect(spine.isPollable(spineResponse)).toBe(false)
    expect((spineResponse as spine.SpineDirectResponse<string>).statusCode).toBe(200)
    expect(mock.history.post.length).toBe(2)
    expect(loggerWarnSpy).toHaveBeenCalledWith("Call to spine failed - retrying. Retry count 1")
  })
})

function readFileAsString(filename: string): string {
  return fs.readFileSync(path.join(__dirname, `../../resources/spine-responses/${filename}`), "utf-8")
}

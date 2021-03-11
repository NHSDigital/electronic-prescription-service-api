import "jest"
import * as moxios from "moxios"
import axios from "axios"
import fs from "fs"
import {isDirect, isPollable, SpineDirectResponse, SpinePollableResponse, SpineRequest} from "../../src/models/spine"
import {LiveSpineClient} from "../../src/services/communication/live-spine-client"
import path from "path"
import pino from "pino"
import {FhirMessageProcessingError} from "../../src/models/errors/processing-errors"
import {OperationOutcome} from "../../src/models/fhir"

describe("Spine communication", () => {
  const requestHandler = new LiveSpineClient(
    "localhost",
    "Prescribe",
    (spineRequest: SpineRequest) => `<wrap>${spineRequest.message}</wrap>`
  )

  const logger = pino()

  beforeEach(() => {
    moxios.install(axios)
  })

  afterEach(() => {
    moxios.uninstall(axios)
  })

  test("Successful send response returns pollable result", async () => {
    moxios.wait(() => {
      const request = moxios.requests.mostRecent()
      request.respondWith({
        status: 202,
        statusText: "OK",
        headers: {
          "content-location": "/_poll/test-content-location"
        }
      })
    })

    const spineResponse = await requestHandler.send(
      {message: "test", interactionId: "test2"},
      logger
    )

    expect(spineResponse.statusCode).toBe(202)
    expect(isPollable(spineResponse)).toBe(true)
    expect((spineResponse as SpinePollableResponse).pollingUrl).toBe("example.com/eps/_poll/test-content-location")
  })

  test("Unsuccesful send response returns non-pollable result", async () => {
    moxios.wait(() => {
      const request = moxios.requests.mostRecent()
      request.respondWith({status: 400})
    })

    const spineResponse = await requestHandler.send(
      {message: "test", interactionId: "test2"},
      logger
    )

    expect(isPollable(spineResponse)).toBe(false)
    expect((spineResponse as SpineDirectResponse<string>).statusCode).toBe(400)
  })

  test("Successful polling pending response returns pollable result", async () => {
    moxios.wait(() => {
      const request = moxios.requests.mostRecent()
      request.respondWith({
        status: 202,
        statusText: "OK",
        headers: {
          "content-location": "/_poll/test-content-location"
        }
      })
    })

    const spineResponse = await requestHandler.poll("test", logger)

    expect(spineResponse.statusCode).toBe(202)
    expect(isPollable(spineResponse)).toBe(true)
    expect((spineResponse as SpinePollableResponse).pollingUrl).toBe("example.com/eps/_poll/test-content-location")
  })

  test("Async success messages returned from spine return a 200 response", async () => {
    moxios.wait(() => {
      const request = moxios.requests.mostRecent()
      request.respondWith({
        status: 200,
        statusText: "OK",
        responseText: readFileAsString("async_success.xml")
      })
    })

    const spineResponse = await requestHandler.send(
      {message: "test", interactionId: "test2"},
      logger
    )

    expect(spineResponse.statusCode).toBe(200)
    expect(isDirect(spineResponse)).toBe(true)
    expect((spineResponse as SpineDirectResponse<string>).body).toContain("<hl7:acknowledgement typeCode=\"AA\">")
  })

  test("Successful polling complete response returns non pollable result", async () => {
    moxios.wait(() => {
      const request = moxios.requests.mostRecent()
      request.respondWith({
        status: 200,
        statusText: "OK",
        responseText: 'acknowledgement typeCode="AA"'
      })
    })

    const spineResponse = await requestHandler.poll("test", logger)

    expect(spineResponse.statusCode).toBe(200)
    expect(isPollable(spineResponse)).toBe(false)
  })

  test("Spine communication failure returns a 500 error result", async () => {
    moxios.wait(() => {
      const request = moxios.requests.mostRecent()
      request.respondWithTimeout()
    })

    const spineResponse = await requestHandler.send(
      {message: "test", interactionId: "test2"},
      logger
    )

    expect(isPollable(spineResponse)).toBe(false)
    expect((spineResponse as SpineDirectResponse<string>).statusCode).toBe(500)
  })
})

describe("Live wrapper error handling", () => {
  const fhirErrorID = "acceptedId"
  const requestHandler = new LiveSpineClient(
    "localhost",
    "Prescribe",
    (spineRequest: SpineRequest) => {
      if(spineRequest.interactionId === fhirErrorID) {
        throw new FhirMessageProcessingError("", "")
      } else {
        throw new Error()
      }
    }
  )

  const logger = pino()

  test("converts FhirMessageProcessingError to operation outcome when thrown in ebxml wrapper", async () => {
    const spineResponse = await requestHandler.send(
      {message: "test", interactionId: fhirErrorID},
      logger
    )
    expect((spineResponse as SpineDirectResponse<OperationOutcome>).body.resourceType).toBe("OperationOutcome")
    expect((spineResponse as SpineDirectResponse<string>).statusCode).toBe(400)
  })

  test("other errors not converted", async () => {
    await expect(() => requestHandler.send(
      {message: "test", interactionId: "generic error id"},
      logger
    )).rejects.toThrow()
  })
})

describe("Spine responses", () => {
  test("Messages should be correctly identified as pollable", () => {
    const message = {
      statusCode: 200,
      pollingUrl: "http://test.com"
    }

    expect(isPollable(message)).toBe(true)
  })

  test("Messages should be correctly identified as non-pollable", () => {
    const message = {
      statusCode: 200,
      body: "This is a response body"
    }

    expect(isPollable(message)).toBe(false)
  })
})

function readFileAsString(filename: string): string {
  return fs.readFileSync(path.join(__dirname, `../resources/spine-responses/${filename}`), "utf-8")
}

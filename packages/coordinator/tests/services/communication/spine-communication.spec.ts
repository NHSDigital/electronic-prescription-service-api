import "jest"
import MockAdapter from "axios-mock-adapter"
import axios from "axios"
import fs from "fs"
import {spine} from "@models"
import {LiveSpineClient} from "../../../src/services/communication/live-spine-client"
import path from "path"
import pino from "pino"
import {Agent} from "https"

const mock = new MockAdapter(axios)

describe("Spine communication", () => {
  afterEach(() => {
    mock.reset()
    jest.resetModules()
    delete process.env.MTLS_SPINE_CLIENT
    delete process.env.SpinePrivateKey
    delete process.env.SpinePublicCertificate
    delete process.env.SpineCAChain
  })

  const requestHandler = new LiveSpineClient(
    "localhost",
    "Prescribe",
    (spineRequest: spine.SpineRequest) => `<wrap>${spineRequest.message}</wrap>`
  )

  const logger = pino()

  const mockRequest = {
    message: "test",
    interactionId: "test2",
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
    const asyncSuccess = readFileAsString("async_success.xml")
    mock.onPost().reply(200, `statusText: "OK", responseText: ${asyncSuccess}`)

    const spineResponse = await requestHandler.send(mockRequest, logger)

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

    const spineResponse = await requestHandler.send(mockRequest, logger)

    expect(spine.isPollable(spineResponse)).toBe(false)
    expect((spineResponse as spine.SpineDirectResponse<string>).statusCode).toBe(500)
  })

  test("mTLS client initializes HTTPS agent when environment variables are set", () => {
    process.env.MTLS_SPINE_CLIENT = "1"
    process.env.SpinePrivateKey = "mock-private-key"
    process.env.SpinePublicCertificate = "mock-public-cert"
    process.env.SpineCAChain = "mock-ca-chain"

    const client = new LiveSpineClient("localhost", "Prescription")

    expect(client["httpsAgent"]).toBeInstanceOf(Agent)
  })

  test("mTLS client throws error when mTLS is enabled but environment variables are missing", () => {
    process.env.MTLS_SPINE_CLIENT = "1"

    const errorMessage = "One or more required environment variables for mTLS are missing."

    expect(() => new LiveSpineClient("localhost", "Prescription")).toThrow(errorMessage)
  })

  test("Non-mTLS client does not initialize HTTPS agent", () => {
    process.env.MTLS_SPINE_CLIENT = "0"

    const client = new LiveSpineClient("localhost", "Prescription")

    expect(client["httpsAgent"]).toBeNull()
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

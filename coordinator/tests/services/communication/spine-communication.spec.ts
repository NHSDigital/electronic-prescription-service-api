import "jest"
import * as moxios from "moxios"
import axios from "axios"
import fs from "fs"
import {spine} from "@models"
import {LiveSpineClient} from "../../../src/services/communication/live-spine-client"
import path from "path"
import pino from "pino"

describe("Spine communication", () => {
  const requestHandler = new LiveSpineClient(
    "localhost",
    "Prescribe",
    (spineRequest: spine.SpineRequest) => `<wrap>${spineRequest.message}</wrap>`
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
      {message: "test", interactionId: "test2", fromPartyKey: "test3"},
      logger
    )

    expect(spineResponse.statusCode).toBe(202)
    expect(spine.isPollable(spineResponse)).toBe(true)
    expect((spineResponse as spine.SpinePollableResponse).pollingUrl)
      .toBe("example.com/eps/_poll/test-content-location")
  })

  test("Unsuccessful send response returns non-pollable result", async () => {
    moxios.wait(() => {
      const request = moxios.requests.mostRecent()
      request.respondWith({status: 400})
    })

    const spineResponse = await requestHandler.send(
      {message: "test", interactionId: "test2", fromPartyKey: "test3"},
      logger
    )

    expect(spine.isPollable(spineResponse)).toBe(false)
    expect((spineResponse as spine.SpineDirectResponse<string>).statusCode).toBe(400)
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

    const spineResponse = await requestHandler.poll("test", "200000001285", logger)

    expect(spineResponse.statusCode).toBe(202)
    expect(spine.isPollable(spineResponse)).toBe(true)
    expect((spineResponse as spine.SpinePollableResponse).pollingUrl)
      .toBe("example.com/eps/_poll/test-content-location")
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
      {message: "test", interactionId: "test2", fromPartyKey: "test3"},
      logger
    )

    expect(spineResponse.statusCode).toBe(200)
    expect(spine.isDirect(spineResponse)).toBe(true)
    expect((spineResponse as spine.SpineDirectResponse<string>).body).toContain("<hl7:acknowledgement typeCode=\"AA\">")
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

    const spineResponse = await requestHandler.poll("test", "200000001285", logger)

    expect(spineResponse.statusCode).toBe(200)
    expect(spine.isPollable(spineResponse)).toBe(false)
  })

  test("Status response", async () => {
    moxios.wait(() => {
      const request = moxios.requests.mostRecent()
      request.respondWith({
        status: 200
      })
    })

    const statusResponse = await requestHandler.getStatus()

    expect(statusResponse.status).toBe("pass")
    expect(statusResponse.responseCode).toBe(200)
  })

  test("Spine communication failure returns a 500 error result", async () => {
    moxios.wait(() => {
      const request = moxios.requests.mostRecent()
      request.respondWithTimeout()
    })

    const spineResponse = await requestHandler.send(
      {message: "test", interactionId: "test2", fromPartyKey: "test3"},
      logger
    )

    expect(spine.isPollable(spineResponse)).toBe(false)
    expect((spineResponse as spine.SpineDirectResponse<string>).statusCode).toBe(500)
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

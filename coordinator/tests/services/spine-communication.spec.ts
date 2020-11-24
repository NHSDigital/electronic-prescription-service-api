import "jest"
import * as moxios from "moxios"
import axios from "axios"
import fs from "fs"
import {isDirect, isPollable, SpineDirectResponse, SpinePollableResponse, SpineRequest} from "../../src/models/spine"
import {LiveRequestHandler} from "../../src/services/handlers/spine-handler"
import path from "path"

describe("Spine communication", () => {

  const requestHandler = new LiveRequestHandler(
    "localhost",
    "/Prescribe",
    (spineRequest: SpineRequest) => `<wrap>${spineRequest.message}</wrap>`
  )

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

    const spineResponse = await requestHandler.send({message: "test", interactionId: "test2"})

    expect(spineResponse.statusCode).toBe(202)
    expect(isPollable(spineResponse)).toBe(true)
    expect((spineResponse as SpinePollableResponse).pollingUrl).toBe("example.com/eps/_poll/test-content-location")
  })

  test("Unsuccesful send response returns non-pollable result", async () => {
    moxios.wait(() => {
      const request = moxios.requests.mostRecent()
      request.respondWith({status: 400})
    })

    const spineResponse = await requestHandler.send({message: "test", interactionId: "test2"})

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

    const spineResponse = await requestHandler.poll("test")

    expect(spineResponse.statusCode).toBe(202)
    expect(isPollable(spineResponse)).toBe(true)
    expect((spineResponse as SpinePollableResponse).pollingUrl).toBe("example.com/eps/_poll/test-content-location")
  })

  test("Async responses that do not contain a successful ack code return a 400 response", async () => {
    moxios.wait(() => {
      const request = moxios.requests.mostRecent()
      request.respondWith({
        status: 200,
        statusText: "OK",
        responseText: readFileAsString("async_error.xml")
      })
    })

    const spineResponse = await requestHandler.send({message: "test", interactionId: "test2"})

    expect(spineResponse.statusCode).toBe(400)
    expect(isDirect(spineResponse)).toBe(true)
    expect((spineResponse as SpineDirectResponse<string>).body).toContain('<hl7:acknowledgement typeCode="AE">')
  })

  test("Sync responses that do not contain a successful ack code return a 400 response", async () => {
    moxios.wait(() => {
      const request = moxios.requests.mostRecent()
      request.respondWith({
        status: 200,
        statusText: "OK",
        responseText: readFileAsString("sync_error.xml")
      })
    })

    const spineResponse = await requestHandler.send({message: "test", interactionId: "test2"})

    expect(spineResponse.statusCode).toBe(400)
    expect(isDirect(spineResponse)).toBe(true)
    expect((spineResponse as SpineDirectResponse<string>).body).toContain('<acknowledgement typeCode="AR">')
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

    const spineResponse = await requestHandler.send({message: "test", interactionId: "test2"})

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

    const spineResponse = await requestHandler.poll("test")

    expect(spineResponse.statusCode).toBe(200)
    expect(isPollable(spineResponse)).toBe(false)
  })

  test("Spine communication failure returns a 500 error result", async () => {
    moxios.wait(() => {
      const request = moxios.requests.mostRecent()
      request.respondWithTimeout()
    })

    const spineResponse = await requestHandler.send({message: "test", interactionId: "test2"})

    expect(isPollable(spineResponse)).toBe(false)
    expect((spineResponse as SpineDirectResponse<string>).statusCode).toBe(500)
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

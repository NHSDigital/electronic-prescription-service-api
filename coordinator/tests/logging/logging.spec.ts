import Hapi from "@hapi/hapi"

import {RequestHeaders} from "../../src/utils/headers"
import {createServer} from "../../src/server"
import * as TestResources from "../resources/test-resources"
import {
  configureLogging,
  expectPayloadHashAuditLog,
  getPostRequestValidHeaders,
  isPrepareEndpointResponse,
  testIfValidPayload
} from "./helpers"

// Custom matcher
// https://medium.com/@andrei.pfeiffer/jest-matching-objects-in-array-50fe2f4d6b98
expect.extend({
  toContainObject(received: unknown, argument: unknown) {
    const pass = this.equals(received,
      expect.arrayContaining([
        expect.objectContaining(argument)
      ])
    )

    if (pass) {
      return {
        // eslint-disable-next-line max-len
        message: () => (`expected ${this.utils.printReceived(received)} not to contain object ${this.utils.printExpected(argument)}`),
        pass: true
      }
    } else {
      return {
        // eslint-disable-next-line max-len
        message: () => (`expected ${this.utils.printReceived(received)} to contain object ${this.utils.printExpected(argument)}`),
        pass: false
      }
    }
  }
})

let server: Hapi.Server
let headers: Hapi.Util.Dictionary<string>
let logs: Array<Hapi.RequestLog>

// eslint-disable-next-line max-len
describe.each(TestResources.specification)("When a request payload is sent to a", (example: TestResources.ExamplePrescription) => {
  beforeAll(async () => {
    server = await createServer({collectLogs: true})
    configureLogging(server)
    await server.initialize()

    headers = TestResources.validTestHeaders
    headers[RequestHeaders.SKIP_VALIDATION] = "true"
  })

  afterAll(async () => {
    await server.stop()
  })

  describe("prescribing endpoint", () => {
    describe("$prepare", () => {
      beforeAll(async () => {
        const request = getPostRequestValidHeaders("/FHIR/R4/$prepare", headers, example.fhirMessageUnsigned)
        const res = await server.inject(request)
        logs = res.request.logs
      })

      test("the payload hash is logged", async () => {
        expectPayloadHashAuditLog(logs)
      })

      test("digest, timestamp, and algorithm are logged", async () => {
        logs.forEach((log) => {
          if (isPrepareEndpointResponse(log.data)) {
            expect(log.data.PrepareEndpointResponse.parameter).toContainObject({name: "digest"})
            expect(log.data.PrepareEndpointResponse.parameter).toContainObject({name: "timestamp"})
            expect(log.data.PrepareEndpointResponse.parameter).toContainObject({name: "algorithm"})
          }
        })
      })
    })

    describe("/$process-message#prescription-order", () => {
      beforeAll(async () => {
        const request = getPostRequestValidHeaders("/FHIR/R4/$process-message", headers, example.fhirMessageSigned)
        const res = await server.inject(request)
        logs = res.request.logs
      })

      test("the payload hash is logged", async () => {
        expectPayloadHashAuditLog(logs)
      })
    })

    describe("/$process-message#prescription-order-update", () => {
      beforeAll(async () => {
        const request = getPostRequestValidHeaders("/FHIR/R4/$process-message", headers, example.fhirMessageSigned)
        const res = await server.inject(request)
        logs = res.request.logs
      })

      test("the payload hash is logged", async () => {
        expectPayloadHashAuditLog(logs)
      })
    })
  })

  describe("dispensing endpoint", () => {
    describe("/$verify-signature", () => {
      beforeAll(async () => {
        const request = getPostRequestValidHeaders("/FHIR/R4/$verify-signature", headers, example.fhirMessageSigned)
        const res = await server.inject(request)
        logs = res.request.logs
      })

      test("the payload hash is logged", async () => {
        expectPayloadHashAuditLog(logs)
      })
    })

    describe("/$process-message#dispense-notification", () => {
      beforeAll(async () => {
        const request = getPostRequestValidHeaders("/FHIR/R4/$process-message", headers, example.fhirMessageSigned)
        const res = await server.inject(request)
        logs = res.request.logs
      })

      test("the payload hash is logged", async () => {
        expectPayloadHashAuditLog(logs)
      })
    })

    describe("/Claim", () => {
      beforeAll(async () => {
        const request = getPostRequestValidHeaders("/FHIR/R4/Claim", headers, example.fhirMessageClaim)
        const res = await server.inject(request)
        logs = res.request.logs
      })

      testIfValidPayload(example.fhirMessageClaim)("the payload hash is logged", async () => {
        if (!example.fhirMessageClaim) describe.skip
        expectPayloadHashAuditLog(logs)
      })
    })

    describe("/Task/$release", () => {
      beforeAll(async () => {
        const request = getPostRequestValidHeaders("/FHIR/R4/Task/$release", headers, example.fhirMessageReleaseRequest)
        const res = await server.inject(request)
        logs = res.request.logs
      })

      testIfValidPayload(example.fhirMessageReleaseRequest)("the payload hash is logged", async () => {
        expectPayloadHashAuditLog(logs)
      })
    })

    describe("/Task#return ", () => {
      beforeAll(async () => {
        const request = getPostRequestValidHeaders("/FHIR/R4/Task", headers, example.fhirMessageReturnRequest)
        const res = await server.inject(request)
        logs = res.request.logs
      })

      testIfValidPayload(example.fhirMessageReturnRequest)("the payload hash is logged", async () => {
        expectPayloadHashAuditLog(logs)
      })
    })

    describe("/Task#withdraw ", () => {
      beforeAll(async () => {
        const request = getPostRequestValidHeaders("/FHIR/R4/Task", headers, example.fhirMessageWithdrawRequest)
        const res = await server.inject(request)
        logs = res.request.logs
      })

      testIfValidPayload(example.fhirMessageWithdrawRequest)("the payload hash is logged", async () => {
        expectPayloadHashAuditLog(logs)
      })
    })
  })
})

import Hapi from "@hapi/hapi"

import {fhir} from "@models"
import {RequestHeaders} from "../../src/utils/headers"
import {createServer} from "../../src/server"
import * as TestResources from "../resources/test-resources"
import {configureLogging, getPostRequestValidHeaders, testIfValidPayload} from "./helpers"
import {PayloadIdentifiersValidator} from "./validation"
import {
  expectPayloadAuditLogs,
  expectPayloadIdentifiersAreLogged,
  expectPrepareEndpointParametersAreLogged
} from "./expectations"

let server: Hapi.Server

const injectServerRequest = async (
  endpoint: string,
  headers: Hapi.Utils.Dictionary<string>,
  payload: fhir.Resource
): Promise<Array<Hapi.RequestLog>> => {
  const request = getPostRequestValidHeaders(endpoint, headers, payload)
  const res = await server.inject(request)
  return res.request.logs
}

// eslint-disable-next-line max-len
describe.each(TestResources.specification)(
  "When a request payload is sent to a",
  (example: TestResources.ExamplePrescription) => {
    let headers: Hapi.Utils.Dictionary<string>
    let logs: Array<Hapi.RequestLog>

    beforeAll(async () => {
      server = createServer({collectLogs: true})
      await configureLogging(server)
      await server.start()

      headers = TestResources.validTestHeaders
      headers[RequestHeaders.SKIP_VALIDATION] = "true"
    })

    afterAll(async () => {
      await server.stop()
    })

    describe("prescribing endpoint", () => {
      let bundle: fhir.Bundle

      describe("$\\prepare", () => {
        describe("using SHA1", () => {
          prepareTests(false)
        })
        describe("using SHA256", () => {
          prepareTests(true)
        })
        function prepareTests(useSHA256: boolean) {
          beforeAll(async () => {
            bundle = example.fhirMessageUnsigned
            process.env.USE_SHA256_PREPARE = String(useSHA256)
            logs = await injectServerRequest("/FHIR/R4/$prepare", headers, bundle)
          })

          test("the payload hash is logged", async () => {
            expectPayloadAuditLogs(logs, "/$prepare", useSHA256)
          })

          test("digest, timestamp, and algorithm are logged", async () => {
            expectPrepareEndpointParametersAreLogged(logs)
          })

          test("payload identifiers are logged", async () => {
            expectPayloadIdentifiersAreLogged(logs)
          })
        }
      })

      describe("/$\\process-message#prescription-order", () => {
        let bundle: fhir.Bundle

        beforeAll(async () => {
          bundle = example.fhirMessageSigned
          logs = await injectServerRequest("/FHIR/R4/$process-message", headers, bundle)
        })

        test("the payload hash is logged", async () => {
          expectPayloadAuditLogs(logs, "/$process-message")
        })

        test("payload identifiers are logged", async () => {
          expectPayloadIdentifiersAreLogged(logs)
        })
      })

      describe("/$\\process-message#prescription-order-update", () => {
        let bundle: fhir.Bundle

        beforeAll(async () => {
          bundle = example.fhirMessageSigned
          logs = await injectServerRequest("/FHIR/R4/$process-message", headers, bundle)
        })

        test("the payload hash is logged", async () => {
          expectPayloadAuditLogs(logs, "/$process-message")
        })

        test("payload identifiers are logged", async () => {
          expectPayloadIdentifiersAreLogged(logs)
        })
      })
    })

    describe("dispensing endpoint", () => {
      describe("/\\$verify-signature", () => {
        let bundle: fhir.Bundle

        beforeAll(async () => {
          bundle = example.fhirMessageSigned
          logs = await injectServerRequest("/FHIR/R4/$verify-signature", headers, bundle)
        })

        test("the payload hash is logged", async () => {
          expectPayloadAuditLogs(logs, "/$verify-signature")
        })

        test("payload identifiers are logged", async () => {
          expectPayloadIdentifiersAreLogged(logs)
        })
      })

      describe("/$process-message#dispense-notification", () => {
        let bundle: fhir.Bundle

        beforeAll(async () => {
          bundle = example.fhirMessageSigned
          logs = await injectServerRequest("/FHIR/R4/$process-message", headers, bundle)
        })

        test("the payload hash is logged", async () => {
          expectPayloadAuditLogs(logs, "/$process-message")
        })

        test("payload identifiers are logged", async () => {
          expectPayloadIdentifiersAreLogged(logs)
        })
      })

      describe("/Claim", () => {
        let claim: fhir.Claim

        beforeAll(async () => {
          claim = example.fhirMessageClaim
          logs = await injectServerRequest("/FHIR/R4/Claim", headers, claim)
        })

        testIfValidPayload(example.fhirMessageClaim)("the payload hash is logged", async () => {
          expectPayloadAuditLogs(logs, "/Claim")
        })

        testIfValidPayload(example.fhirMessageClaim)("payload identifiers are logged", async () => {
          expectPayloadIdentifiersAreLogged(logs)
        })
      })

      describe("/Task/$\\release", () => {
        let parameters: fhir.Parameters

        beforeAll(async () => {
          parameters = example.fhirMessageReleaseRequest
          logs = await injectServerRequest("/FHIR/R4/Task/$release", headers, parameters)
        })

        testIfValidPayload(example.fhirMessageReleaseRequest)("the payload hash is logged", async () => {
          expectPayloadAuditLogs(logs, "/$release")
        })

        testIfValidPayload(example.fhirMessageReleaseRequest)("payload identifiers are logged", async () => {
          const validator = new PayloadIdentifiersValidator()
          // Parameters type payload don't have a top level identifier, and
          // release requests don't include the patient's NHS number
          validator.payloadIdentifier("NotProvided").nhsNumber("NotProvided")
          expectPayloadIdentifiersAreLogged(logs, validator)
        })

        // TODO: Log release response message?
      })

      describe("/Task#return ", () => {
        let task: fhir.Task

        beforeAll(async () => {
          task = example.fhirMessageReturnRequest
          logs = await injectServerRequest("/FHIR/R4/Task", headers, task)
        })

        testIfValidPayload(example.fhirMessageReturnRequest)("the payload hash is logged", async () => {
          expectPayloadAuditLogs(logs, "/Task")
        })

        testIfValidPayload(example.fhirMessageClaim)("payload identifiers are logged", async () => {
          expectPayloadIdentifiersAreLogged(logs)
        })
      })

      describe("/Task#withdraw ", () => {
        let task: fhir.Task

        beforeAll(async () => {
          task = example.fhirMessageWithdrawRequest
          logs = await injectServerRequest("/FHIR/R4/Task", headers, task)
        })

        testIfValidPayload(example.fhirMessageWithdrawRequest)("the payload hash is logged", async () => {
          expectPayloadAuditLogs(logs, "/Task")
        })

        testIfValidPayload(example.fhirMessageClaim)("payload identifiers are logged", async () => {
          expectPayloadIdentifiersAreLogged(logs)
        })
      })
    })
  }
)

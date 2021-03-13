import {InteractionObject} from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import * as LosslessJson from "lossless-json"
import * as uuid from "uuid"
import * as TestResources from "../../resources/test-resources"
import {basePath, pactOptions} from "../../resources/common"
import * as fhir from "../../models/fhir"

jestpact.pactWith(
  pactOptions("sandbox", "task"),
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async (provider: any) => {
    const client = () => {
      const url = `${provider.mockService.baseUrl}`
      return supertest(url)
    }

    describe("Task withdraw sandbox e2e tests", () => {
      test.each(TestResources.taskWithdrawCases)(
        "should be able to withdraw %s",
        async (desc: string, message: fhir.Bundle) => {
          const apiPath = `${basePath}/Task`
          const messageStr = LosslessJson.stringify(message)
          const requestId = uuid.v4()
          const correlationId = uuid.v4()

          const interaction: InteractionObject = {
            state: "is not authenticated",
            uponReceiving: `a request to withdraw ${desc} message`,
            withRequest: {
              headers: {
                "Content-Type": "application/fhir+json; fhirVersion=4.0",
                "X-Request-ID": requestId,
                "X-Correlation-ID": correlationId
              },
              method: "POST",
              path: apiPath,
              body: JSON.parse(messageStr)
            },
            willRespondWith: {
              headers: {
                "Content-Type": "application/json",
                "X-Request-ID": requestId,
                "X-Correlation-ID": correlationId
              },
              //TODO - revert once translations are implemented
              // body: {
              //   "resourceType": "OperationOutcome",
              //   "issue": [
              //     {
              //       "code": "informational",
              //       "severity": "information"
              //     }
              //   ]
              // },
              //status: 200
              status: 400
            }
          }
          await provider.addInteraction(interaction)
          await client()
            .post(apiPath)
            .set("Content-Type", "application/fhir+json; fhirVersion=4.0")
            .set("X-Request-ID", requestId)
            .set("X-Correlation-ID", correlationId)
            .send(messageStr)
            .expect(200)
        }
      )
    })

    describe("Task return sandbox e2e tests", () => {
      test.each(TestResources.taskReturnCases)(
        "should be able to process %s",
        async (desc: string, message: fhir.Bundle) => {
          const apiPath = `${basePath}/Task`
          const messageStr = LosslessJson.stringify(message)
          const requestId = uuid.v4()
          const correlationId = uuid.v4()

          const interaction: InteractionObject = {
            state: "is not authenticated",
            uponReceiving: `a request to return ${desc} message`,
            withRequest: {
              headers: {
                "Content-Type": "application/fhir+json; fhirVersion=4.0",
                "X-Request-ID": requestId,
                "X-Correlation-ID": correlationId
              },
              method: "POST",
              path: apiPath,
              body: JSON.parse(messageStr)
            },
            willRespondWith: {
              headers: {
                "Content-Type": "application/json",
                "X-Request-ID": requestId,
                "X-Correlation-ID": correlationId
              },
              body: {
                "resourceType": "OperationOutcome",
                "issue": [
                  {
                    "code": "informational",
                    "severity": "information"
                  }
                ]
              },
              status: 200
            }
          }
          await provider.addInteraction(interaction)
          await client()
            .post(apiPath)
            .set("Content-Type", "application/fhir+json; fhirVersion=4.0")
            .set("X-Request-ID", requestId)
            .set("X-Correlation-ID", correlationId)
            .send(messageStr)
            .expect(200)
        }
      )
    })
  }
)

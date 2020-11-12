import {InteractionObject, Matchers} from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import * as TestResources from "../resources/test-resources"
import {Bundle, Parameters} from "../models/fhir/fhir-resources"
import * as LosslessJson from "lossless-json"
import {processExamples} from "../services/process-example-fetcher"

const isInt = process.env.APIGEE_ENVIRONMENT === "int"
const pactVersion = isInt ? `${process.env.PACT_VERSION}.int` : process.env.PACT_VERSION

jestpact.pactWith(
  {
    spec: 3,
    consumer: `nhsd-apim-eps-test-client+${pactVersion}`,
    provider: `nhsd-apim-eps-sandbox+${pactVersion}`,
    pactfileWriteMode: "overwrite"
  },
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async (provider: any) => {
    const client = () => {
      const url = `${provider.mockService.baseUrl}`
      return supertest(url)
    }

    describe("prepare sandbox e2e tests", () => {

      test.each(TestResources.prepareCases)("should be able to prepare a %s message", async (description: string, request: Bundle, response: Parameters) => {
        const apiPath = "/$prepare"
        const requestStr = LosslessJson.stringify(request)
        const responseStr = LosslessJson.stringify(response)
        const interaction: InteractionObject = {
          state: null,
          uponReceiving: `a request to prepare a ${description} message`,
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0"
            },
            method: "POST",
            path: "/$prepare",
            body: JSON.parse(requestStr)
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0"
            },
            body: JSON.parse(responseStr),
            status: 200
          }
        }
        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set('Content-Type', 'application/fhir+json; fhirVersion=4.0')
          .send(requestStr)
          .expect(200)
      })
    })

    describe("process-message sandbox e2e tests", () => {

      test.each(TestResources.processCases)("should be able to process %s", async (desc: string, message: Bundle) => {
        const apiPath = "/$process-message"
        const messageStr = LosslessJson.stringify(message)
        const interaction: InteractionObject = {
          state: null,
          uponReceiving: `a request to process ${desc} message to Spine`,
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0"
            },
            method: "POST",
            path: "/$process-message",
            body: JSON.parse(messageStr)
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0"
            },
            body: {
              resourceType: "OperationOutcome",
              issue: [
                {
                  code: Matchers.string("informational"),
                  severity: Matchers.string("information")
                }
              ]
            },
            status: 200
          }
        }
        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set('Content-Type', 'application/fhir+json; fhirVersion=4.0')
          .send(messageStr)
          .expect(200)
      })

      test("Should be able to process JSON content type", async () => {
        const testCase = processExamples[0]

        const apiPath = "/$process-message"
        const messageStr = LosslessJson.stringify(testCase.request)

        const interaction: InteractionObject = {
          state: null,
          uponReceiving: `a request to process a message with a standard JSON content type header`,
          withRequest: {
            headers: {
              "Content-Type": "application/json"
            },
            method: "POST",
            path: "/$process-message",
            body: JSON.parse(messageStr)
          },
          willRespondWith: {
            status: 200
          }
        }
        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set('Content-Type', 'application/json')
          .send(messageStr)
          .expect(200)
      })

      test("Should reject unsupported content types", async () => {
        const testCase = processExamples[0]
        const apiPath = "/$process-message"
        const messageStr = LosslessJson.stringify(testCase.request)
        const interaction: InteractionObject = {
          state: null,
          uponReceiving: `a request to process a message with an unsupported content type header`,
          withRequest: {
            headers: {
              "Content-Type": "video/mpeg"
            },
            method: "POST",
            path: "/$process-message",
            body: JSON.parse(messageStr)
          },
          willRespondWith: {
            status: 415
          }
        }
        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set('Content-Type', 'video/mpeg')
          .send(messageStr)
      })
    })
  }
)

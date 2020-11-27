import {InteractionObject, Matchers} from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import * as TestResources from "../resources/test-resources"
import {Bundle, Parameters} from "../models/fhir/fhir-resources"
import * as LosslessJson from "lossless-json"
import {processExamples} from "../services/process-example-fetcher"

jestpact.pactWith(
  {
    spec: 3,
    consumer: `nhsd-apim-eps-test-client+${process.env.PACT_VERSION}`,
    provider: `nhsd-apim-eps-sandbox+${process.env.PACT_VERSION}`,
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

        const outputMessageDigest = response.parameter
          .find(p => p.name === "digest").valueString
        const outputMessageFragments = response.parameter
          .find(p => p.name === "fragments").valueString
        const outputMessageDisplay = response.parameter
          .find(p => p.name === "display").valueString
          
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
            body: {
              resourceType: "Parameters",
              parameter: [
                {
                  name: "fragments",
                  valueString: Matchers.like(outputMessageFragments)
                },
                {
                  name: "digest",
                  valueString: `${outputMessageDigest}`
                },
                {
                  name: "display",
                  valueString: Matchers.like(outputMessageDisplay)
                },
                {
                  name: "algorithm",
                  valueString: "RS1"
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

      test("Should be able to process a FHIR JSON Accept header", async () => {
        const testCase = processExamples[0]

        const apiPath = "/$process-message"
        const messageStr = LosslessJson.stringify(testCase.request)

        const interaction: InteractionObject = {
          state: null,
          uponReceiving: `a request to process a message with a FHIR JSON Accept header`,
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0",
              "Accept": "application/fhir+json"
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
          .set('Content-Type', 'application/fhir+json; fhirVersion=4.0')
          .set('Accept', 'application/fhir+json')
          .send(messageStr)
          .expect(200)
      })
    })
  }
)

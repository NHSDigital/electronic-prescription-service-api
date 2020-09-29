import {InteractionObject, Matchers} from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import * as TestResources from "../resources/test-resources"
import {Bundle, Parameters} from "../resources/fhir-resources"
import * as LosslessJson from "lossless-json"

jestpact.pactWith(
  {
    spec: 3,
    consumer: `nhsd-apim-eps-test-client+${process.env.BUILD_VERSION}`,
    provider: `nhsd-apim-eps+${process.env.BUILD_VERSION}`,
    pactfileWriteMode: "overwrite"
  },
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async (provider: any) => {
    const client = () => {
      const url = `${provider.mockService.baseUrl}`
      return supertest(url)
    }

    describe("prepare e2e tests", () => {

      test.each(TestResources.prepareCases)("should be able to prepare a %s message", async (desc: string, inputMessage: Bundle, outputMessage: Parameters) => {
        const apiPath = "/$prepare"
        const inputMessageStr = LosslessJson.stringify(inputMessage)
        const interaction: InteractionObject = {
          state: null,
          uponReceiving: `a request to prepare ${desc} message`,
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0",
              "NHSD-Session-URID": "1234"
            },
            method: "POST",
            path: "/$prepare",
            body: JSON.parse(inputMessageStr)
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0"
            },
            body: outputMessage,
            status: 200
          }
        }
        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set('Content-Type', 'application/fhir+json; fhirVersion=4.0')
          .set('NHSD-Session-URID', '1234')
          .send(inputMessageStr)
          .expect(200)
      })
    })

    describe("process-message e2e tests", () => {
      
      test.each(TestResources.sendCases)("should be able to send %s", async (desc: string, message: Bundle) => {
        const apiPath = "/$process-message"
        const messageStr = LosslessJson.stringify(message)
        const interaction: InteractionObject = {
          state: null,
          uponReceiving: `a request to send ${desc} message to Spine`,
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0",
              "NHSD-Session-URID": "1234"
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
          .set('NHSD-Session-URID', '1234')
          .send(messageStr)
          .expect(200)
      })
    })
  }
)

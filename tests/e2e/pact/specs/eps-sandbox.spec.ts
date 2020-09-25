import {InteractionObject, Matchers} from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import * as TestResources from "../resources/test-resources"
import {Bundle, Parameters} from "../resources/fhir-resources"
import * as LosslessJson from "lossless-json"

jestpact.pactWith(
  {
    spec: 3,
    consumer: "nhsd-apim-eps-test-client",
    provider: "nhsd-apim-eps-sandbox",
    pactfileWriteMode: "overwrite"
  },
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async (provider: any) => {
    const client = () => {
      const url = `${provider.mockService.baseUrl}`
      return supertest(url)
    }

    describe("eps sandbox e2e tests", () => {

      test.each(TestResources.convertCases)("should be able to convert %s message to HL7V3", async (desc: string, request: Bundle, response: string, responseMatcher: string) => {
        const regex = new RegExp(responseMatcher)
        const isMatch = regex.test(response)
        expect(isMatch).toBe(true)

        const requestStr = LosslessJson.stringify(request)
        const requestJson = JSON.parse(requestStr)
        
        const apiPath = "/$convert"
        const interaction: InteractionObject = {
          state: null,
          uponReceiving: `a request to convert ${desc} message`,
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0",
              "NHSD-Session-URID": "1234"
            },
            method: "POST",
            path: "/$convert",
            body: requestJson
          },
          willRespondWith: {
            headers: {
              "Content-Type": "text/plain"
            },
            body: Matchers.term({ generate: response, matcher: responseMatcher }),
            status: 200
          }
        }
        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set('Content-Type', 'application/fhir+json; fhirVersion=4.0')
          .set('NHSD-Session-URID', '1234')
          .send(requestJson)
          .expect(200)
      })


      test.each(TestResources.prepareCases)("should be able to prepare a %s message", async (desc: string, inputMessage: Bundle, outputMessage: Parameters) => {
        const apiPath = "/$prepare"
        const inputMessageStr = LosslessJson.stringify(inputMessage)
        const outputMessageStr = LosslessJson.stringify(outputMessage)
        const interaction: InteractionObject = {
          state: null,
          uponReceiving: `a request to prepare a ${desc} message`,
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
            body: JSON.parse(outputMessageStr),
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
              "Content-Location": Matchers.string("_poll/9807d292_074a_49e8_b48d_52e5bbf785ed")
            },
            status: 202
          }
        }
        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set('Content-Type', 'application/fhir+json; fhirVersion=4.0')
          .set('NHSD-Session-URID', '1234')
          .send(messageStr)
          .expect(202)
      })

      test("should be able to poll for a prescription response", async () => {
        const apiPath = "/_poll/9807d292_074a_49e8_b48d_52e5bbf785ed"
        const interaction: InteractionObject = {
          state: null,
          uponReceiving: "a request to poll for a prescription response",
          withRequest: {
            headers: {
              "Content-Type": "application/json",
              "NHSD-Session-URID": "1234"
            },
            method: "GET",
            path: apiPath
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0"
            },
            body: {
              resourceType: "OperationOutcome",
              issue: Matchers.eachLike({
                severity: Matchers.string("information"),
                code: Matchers.string("informational"),
                diagnostics: Matchers.string("Message Sent")
              })
            },
            status: 200
          }
        }
        await provider.addInteraction(interaction)
        await client()
          .get(apiPath)
          .set('Content-Type', 'application/json')
          .set('NHSD-Session-URID', '1234')
          .expect(200)
      })
    })
  }
)

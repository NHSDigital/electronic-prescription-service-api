import {InteractionObject, Matchers} from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import * as TestResources from "../resources/test-resources"
import {Bundle, Parameters} from "../resources/fhir-resources"
import * as LosslessJson from "lossless-json"
import {MomentFormatSpecification, MomentInput} from "moment"

jestpact.pactWith(
  {
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

    jest.mock("moment", () => {
      return {
        ...jest.requireActual("moment"),
        utc: (input?: MomentInput, format?: MomentFormatSpecification) =>
          jest.requireActual("moment").utc(input ? input : "2020-06-10T10:26:31.000Z", format)
      }
    })
    
    describe("eps sandbox e2e tests", () => {
      const convertCases = [
        ...TestResources.specification.map(example => [`unsigned ${example.description}`, example.fhirMessageUnsigned, {}]),
        ...TestResources.specification.map(example => [`signed ${example.description}`, example.fhirMessageSigned, {}]),
        ...TestResources.convertSpecs.map(spec => [spec.description, spec.request, spec.response]),
        ...TestResources.specification.filter(example => example.fhirMessageCancel).map(example => [`cancel ${example.description}`, example.fhirMessageCancel, {}])
      ]

      test.each(convertCases)("should be able to convert %s message to HL7V3", async (desc: string, request: Bundle, response: Parameters) => {
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
            body: request
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0"
            },
            body: response,
            status: 200
          }
        }
        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set('Content-Type', 'application/fhir+json; fhirVersion=4.0')
          .set('NHSD-Session-URID', '1234')
          .send(JSON.stringify(request))
          .expect(200)
      })


      const prepareCases = TestResources.specification.map(example => [example.description, example.fhirMessageUnsigned, example.fhirMessageDigest])

      test.each(prepareCases)("should be able to prepare a %s message", async (desc: string, inputMessage: Bundle, outputMessage: Parameters) => {
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

      const sendCases = [
        ...TestResources.specification.map(example => [example.description, example.fhirMessageSigned]),
        ...TestResources.sendSpecs.map(spec => [spec.description, spec.request]),
        ...TestResources.specification.filter(example => example.fhirMessageCancel).map(example => [`cancel ${example.description}`, example.fhirMessageCancel])
      ]

      test.each(sendCases)("should be able to send %s", async (desc: string, message: Bundle) => {
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

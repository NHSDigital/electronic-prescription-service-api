import {InteractionObject, Matchers} from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import * as TestResources from "../resources/test-resources"
import {Bundle, Parameters} from "../models/fhir/fhir-resources"
import * as LosslessJson from "lossless-json"
import * as fetch from "node-fetch"

jestpact.pactWith(
  {
    spec: 3,
    consumer: `nhsd-apim-eps-test-client+${process.env.PACT_VERSION}`,
    provider: `nhsd-apim-eps+${process.env.PACT_VERSION}`,
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
              "Content-Type": "application/fhir+json; fhirVersion=4.0"
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
          .send(inputMessageStr)
          .expect(200)
      })
    })

    describe("process-message e2e tests", () => {

      test.each(TestResources.processCases)("should be able to process %s", async (desc: string, message: Bundle, prepareResponse: Parameters) => {
        const apiPath = "/$process-message"
        const bundleStr = LosslessJson.stringify(message)
        const bundle = JSON.parse(bundleStr) as Bundle

        // X grab related prepare response from example files
        // X upload payload and display from prepare response to signing service, get token

        const signatureRequest = {
          "algorithm": prepareResponse.parameter[3].valueString,
          "payload": prepareResponse.parameter[0].valueString,
          "display": prepareResponse.parameter[2].valueString
        }

        const requestOptions: RequestInit = {
          method: 'POST',
          headers: [
            ["Authorization", `Bearer ${process.env.APIGEE_ACCESS_TOKEN}`],
            ["Content-Type", "application/json"]
          ],
          body: JSON.stringify(signatureRequest)
        }

        const response = await fetch(`https://${process.env.APIGEE_ENVIRONMENT}.api.service.nhs.uk/signing-service/api/v1/SignatureRequest`, requestOptions)
        const responseJson = await response.json()

        const token = responseJson.token
        console.log(`Token: ${token}`)

        // ?? sign payload with smartcard ??
        // upload signature to signing service
        // get signature response from signing service
        // build xmldsig from signing service signature response
        // set provenance data as base64 string of xmldsig

        const interaction: InteractionObject = {
          state: null,
          uponReceiving: `a request to process ${desc} message to Spine`,
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0"
            },
            method: "POST",
            path: "/$process-message",
            body: bundle
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
          .send(bundleStr)
          .expect(200)
      })
    })
  }
)

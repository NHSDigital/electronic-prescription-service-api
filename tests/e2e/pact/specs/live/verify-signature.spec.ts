import * as jestpact from "jest-pact"
import * as uuid from "uuid"
import {basePath, pactOptions} from "../../resources/common"
import supertest from "supertest"
import {fetcher, fhir} from "@models"
import {InteractionObject} from "@pact-foundation/pact"
import * as LosslessJson from "lossless-json"
import {buildVerificationResultParameter} from "@coordinator"

jestpact.pactWith(
  pactOptions("live", "verify-signature"),
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async (provider: any) => {
    const client = () => {
      const url = `${provider.mockService.baseUrl}`
      return supertest(url)
    }

    describe("verify-signature e2e tests", () => {
      test("verify should respond with 200", async () => {
        const innerBundles = [
          fetcher.prescriptionOrderExamples[0].request,
          fetcher.prescriptionOrderExamples[1].request,
          fetcher.prescriptionOrderExamples[2].request
        ]
        const outerBundle = createOuterBundle(innerBundles)
        const apiPath = `${basePath}/$verify-signature`
        const requestId = uuid.v4()
        const correlationId = uuid.v4()

        const messageStr = LosslessJson.stringify(outerBundle)
        const responseBody: fhir.Parameters = {
          "resourceType": "Parameters",
          "parameter": innerBundles.map((bundle, index) => {
            return buildVerificationResultParameter(
              bundle,
              [{
                "severity": "error",
                "code": fhir.IssueCodes.INVALID
              }],
              index)
          })
        }

        const interaction: InteractionObject = {
          state: "is authenticated",
          uponReceiving: "a valid FHIR message",
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0",
              "X-Request-ID": requestId,
              "X-Correlation-ID": correlationId,
              "X-Skip-Validation": "true"
            },
            method: "POST",
            path: apiPath,
            body: JSON.parse(messageStr)
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/json"
            },
            body: responseBody,
            status: 200
          }
        }

        await provider.addInteraction(interaction)
        await client()
          .post(apiPath)
          .set("Content-Type", "application/fhir+json; fhirVersion=4.0")
          .set("Accept", "application/fhir+json")
          .set("X-Request-ID", requestId)
          .set("X-Correlation-ID", correlationId)
          .set("X-Skip-Validation", "true")
          .send(messageStr)
          .expect(200)
      })
    })
  }
)

function createOuterBundle(bundles: Array<fhir.Bundle>): fhir.Bundle {
  return {
    resourceType: "Bundle",
    id: "0cb82cfa-76c8-4fb2-a08e-bf0e326e5487",
    identifier: {
      system: "https://tools.ietf.org/html/rfc4122",
      value: "be66584d-10da-4212-9c95-303b2a1c950b"
    },
    type: "searchset",
    entry: bundles.map(bundle => ({
      resource: bundle,
      fullUrl: "urn:uuid:bluh"
    }))
  }
}

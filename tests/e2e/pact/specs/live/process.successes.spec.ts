import { InteractionObject } from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import * as TestResources from "../../resources/test-resources"
import { Bundle } from "../../models/fhir/fhir-resources"
import * as LosslessJson from "lossless-json"
import * as uuid from "uuid"
import {basePath, pactOptions} from "../../resources/common"
import {regeneratePrescriptionIds} from "../../services/process-example-fetcher"

regeneratePrescriptionIds()

const processPactGroups = [
  {
    name: "secondarycare-community-acute",
    cases: TestResources.processSecondaryCareCommunityAcuteCases
  },
  {
    name: "secondarycare-community-repeatdispensing",
    cases: TestResources.processSecondaryCareCommunityRepeatDispensingCases
  },
  {
    name: "secondarycare-homecare",
    cases: TestResources.processSecondaryCareHomecareCases
  }
]

processPactGroups.forEach(pactGroup => {
  const pactGroupName = pactGroup.name
  const pactGroupTestCases = pactGroup.cases

  jestpact.pactWith(
    pactOptions("live", "process", [pactGroupName]),
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    async (provider: any) => {
      const client = () => {
        const url = `${provider.mockService.baseUrl}`
        return supertest(url)
      }

      describe("process-message e2e tests", () => {
        test.each(pactGroupTestCases)("should be able to process %s", async (desc: string, message: Bundle) => {
          const apiPath = `${basePath}/$process-message`
          const bundleStr = LosslessJson.stringify(message)
          const bundle = JSON.parse(bundleStr) as Bundle

          const requestId = uuid.v4()
          const correlationId = uuid.v4()

          const interaction: InteractionObject = {
            state: "is authenticated",
            uponReceiving: `a request to process ${desc} message to Spine`,
            withRequest: {
              headers: {
                "Content-Type": "application/fhir+json; fhirVersion=4.0",
                "X-Request-ID": requestId,
                "X-Correlation-ID": correlationId
              },
              method: "POST",
              path: apiPath,
              body: bundle
            },
            willRespondWith: {
              headers: {
                "Content-Type": "application/json"
              },
              body: {
                resourceType: "OperationOutcome",
                issue: [
                  {
                    code: "informational",
                    severity: "information",
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
            .send(bundleStr)
            .expect(200)
        })
      })
    }
  )
})

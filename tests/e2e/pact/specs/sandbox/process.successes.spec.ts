import {InteractionObject} from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import * as TestResources from "../../resources/test-resources"
import {Bundle} from "../../models/fhir/fhir-resources"
import * as LosslessJson from "lossless-json"
import {pactOptions} from "../../resources/common"

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
    pactOptions("sandbox", "process", [pactGroupName]),
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    async (provider: any) => {
      const client = () => {
        const url = `${provider.mockService.baseUrl}`
        return supertest(url)
      }

      describe("process-message sandbox e2e tests", () => {
        test.each(pactGroupTestCases)("should be able to process %s", async (desc: string, message: Bundle) => {
          const apiPath = "/$process-message"
          const messageStr = LosslessJson.stringify(message)
          const interaction: InteractionObject = {
            state: "is not authenticated",
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
                "Content-Type": "application/json"
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
      })
    }
  )

})

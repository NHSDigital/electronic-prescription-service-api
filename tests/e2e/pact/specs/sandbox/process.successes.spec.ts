import {InteractionObject} from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import * as TestResources from "../../resources/test-resources"
import {Bundle} from "../../models/fhir/fhir-resources"
import * as LosslessJson from "lossless-json"
import * as uuid from "uuid"
import {basePath, pactOptions} from "../../resources/common"

const processPactGroups = [
  {
    name: "secondarycare-community-acute",
    orderCases: TestResources.processSecondaryCareCommunityAcuteOrderCases,
    orderUpdateCases: TestResources.processSecondaryCareCommunityAcuteOrderUpdateCases
  },
  {
    name: "secondarycare-community-repeatdispensing",
    orderCases: TestResources.processSecondaryCareCommunityRepeatDispensingOrderCases,
    orderUpdateCases: TestResources.processSecondaryCareCommunityRepeatDispensingOrderUpdateCases
  },
  {
    name: "secondarycare-homecare",
    orderCases: TestResources.processSecondaryCareHomecareOrderCases,
    orderUpdateCases: TestResources.processSecondaryCareHomecareOrderUpdateCases
  }
]

processPactGroups.forEach(pactGroup => {
  const pactGroupName = pactGroup.name
  const pactGroupTestCases = [
    ...pactGroup.orderCases,
    ...pactGroup.orderUpdateCases
  ]

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
          const apiPath = `${basePath}/$process-message`
          const messageStr = LosslessJson.stringify(message)
          const requestId = uuid.v4()
          const correlationId = uuid.v4()
          const interaction: InteractionObject = {
            state: "is not authenticated",
            uponReceiving: `a request to process ${desc} message to Spine`,
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
        })
      })
    }
  )
})

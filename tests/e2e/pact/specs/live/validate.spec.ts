import {basePath, getHeaders, pactOptions} from "../../resources/common"
import {InteractionObject} from "@pact-foundation/pact"
import {Pact} from '@pact-foundation/pact'
import {fetcher} from "@models"
import * as LosslessJson from "lossless-json"

const provider = new Pact(pactOptions("live", "validate"))

test("validate e2e tests", async () => {
  provider.setup().then(async () => {
    const testCase = fetcher.convertExamples[0]
    const apiPath = `${basePath}/$validate`

    const messageStr = LosslessJson.stringify(testCase.request)

    const interaction: InteractionObject = {
      state: "is authenticated",
      uponReceiving: "a valid FHIR message",
      withRequest: {
        headers: getHeaders(),
        method: "POST",
        path: apiPath,
        body: messageStr
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
              severity: "information"
            }
          ]
        },
        status: 200
      }
    }

    await provider.addInteraction(interaction)
    await provider.writePact()
  })
})
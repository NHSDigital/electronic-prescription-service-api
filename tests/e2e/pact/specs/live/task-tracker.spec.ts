import {basePath, getHeaders, pactOptions} from "../../resources/common"
import {InteractionObject} from "@pact-foundation/pact"
import {Pact} from '@pact-foundation/pact'

const provider = new Pact(pactOptions("live", "taskTracker"))

test("task tracker e2e test", async () => {
  provider.setup().then(async () => {
    const apiPath = `${basePath}/Task`

    const testPrescriptionId = "EB8B1F-A83008-42DC8L"

    const interaction: InteractionObject = {
      state: "is authenticated",
      uponReceiving: "a valid FHIR message",
      withRequest: {
        headers: getHeaders(),
        query: {
          "focus:identifier": testPrescriptionId
        },
        method: "GET",
        path: apiPath
      },
      willRespondWith: {
        headers: {
          "Content-Type": "application/json"
        },
        status: 200
      }
    }

    await provider.addInteraction(interaction)
    await provider.writePact()
  })
})

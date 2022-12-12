import {PactV3, V3Interaction} from "@pact-foundation/pact"
import * as TestResources from "../../resources/test-resources"
import * as LosslessJson from "lossless-json"
import * as uuid from "uuid"
import {basePath, CreatePactOptions, pactOptions} from "../../resources/common"
import {fhir} from "@models"

describe("prepare sandbox e2e tests", () => {
  test.each(TestResources.prepareErrorCases)(
    "should fail to prepare a %s message",
    async (desc: string, request: fhir.Bundle, response: fhir.Parameters, statusCode: number) => {
      const options = new CreatePactOptions("sandbox", "prepare")
      const provider = new PactV3(pactOptions(options))

      const apiPath = `${basePath}/$prepare`
      const requestStr = LosslessJson.stringify(request)
      const responseStr = LosslessJson.stringify(response)
      const requestId = uuid.v4()
      const correlationId = uuid.v4()

      const interaction: V3Interaction = {
        // state: "is not authenticated",
        uponReceiving: `a request to prepare a ${desc} message`,
        withRequest: {
          headers: {
            "Content-Type": "application/fhir+json; fhirVersion=4.0",
            "X-Request-ID": requestId,
            "X-Correlation-ID": correlationId
          },
          method: "POST",
          path: apiPath,
          body: JSON.parse(requestStr)
        },
        willRespondWith: {
          headers: {
            "Content-Type": "application/fhir+json; fhirVersion=4.0",
            "X-Request-ID": requestId,
            "X-Correlation-ID": correlationId
          },
          body: JSON.parse(responseStr),
          status: statusCode
        }
      }

      await provider.addInteraction(interaction)
    })
})

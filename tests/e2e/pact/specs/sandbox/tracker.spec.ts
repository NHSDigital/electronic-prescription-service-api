import * as jestpact from "jest-pact"
import * as uuid from "uuid"
import {basePath, pactOptions} from "../../resources/common"
import supertest from "supertest"
import {InteractionObject} from "@pact-foundation/pact"

jestpact.pactWith(
  pactOptions("sandbox", "tracker"),
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async (provider: any) => {
    const client = () => {
      const url = `${provider.mockService.baseUrl}`
      return supertest(url)
    }

    describe("tracker e2e test", () => {
      test("should return 200", async () => {
        const apiPath = `${basePath}/$tracker`

        const testPrescriptionId = "EB8B1F-A83008-42DC8L"
        const requestId = uuid.v4()
        const correlationId = uuid.v4()

        const interaction: InteractionObject = {
          state: "is not authenticated",
          uponReceiving: "a valid FHIR message",
          withRequest: {
            headers: {
              "Content-Type": "application/fhir+json; fhirVersion=4.0",
              "X-Request-ID": requestId,
              "X-Correlation-ID": correlationId
            },
            query: {
              "prescription-id": testPrescriptionId
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
        await client()
          .get(apiPath)
          .set("Content-Type", "application/fhir+json; fhirVersion=4.0")
          .set("Accept", "application/fhir+json")
          .set("X-Request-ID", requestId)
          .set("X-Correlation-ID", correlationId)
          .query({"prescription-id": testPrescriptionId})
          .expect(200)
      })
    })
  }
)

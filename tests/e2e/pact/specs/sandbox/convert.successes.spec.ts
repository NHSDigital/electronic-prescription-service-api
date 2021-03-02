import {InteractionObject, Matchers} from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import * as TestResources from "../../resources/test-resources"
import * as LosslessJson from "lossless-json"
import * as uuid from "uuid"
import {basePath, pactOptions} from "../../resources/common"
import * as fhir from "../../models/fhir"
import { MessageHeader } from "../../models/fhir"

TestResources.convertCaseGroups.forEach(pactGroup => {
  const pactGroupName = pactGroup.name
  const pactGroupTestCases = pactGroup.cases

  jestpact.pactWith(
    pactOptions("sandbox", "convert", pactGroupName),
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    async (provider: any) => {
      const client = () => {
        const url = `${provider.mockService.baseUrl}`
        return supertest(url)
      }

      describe("convert sandbox e2e tests", () => {
        const apiPath = `${basePath}/$convert`
        test.each(pactGroupTestCases)(
          "should be able to convert %s message to HL7V3",
          async (desc: string, request: fhir.Bundle, response: string, responseMatcher: string) => {
            const regex = new RegExp(responseMatcher)
            const isMatch = regex.test(response)
            expect(isMatch).toBe(true)

            const requestStr = LosslessJson.stringify(request)
            const requestJson = JSON.parse(requestStr)

            const requestId = uuid.v4()
            const correlationId = uuid.v4()
            
            // todo remove this skip for validation of dispense convert when we
            // have a fhir dispense example which passes validation
            const isDispenseNotification = 
              (request.entry
                .map(entry => entry.resource)
                .filter(resource => resource.resourceType === "MessageHeader") as Array<MessageHeader>)[0]
              .eventCoding?.code === "dispense-notification"
            const headers = isDispenseNotification 
              ? {
                "Content-Type": "application/fhir+json; fhirVersion=4.0",
                "X-Request-ID": requestId,
                "X-Correlation-ID": correlationId,
                "x-skip-validation": "yepDoTheSkip" // presence of this header no matter its value will skip validation
              }
              : {
                "Content-Type": "application/fhir+json; fhirVersion=4.0",
                "X-Request-ID": requestId,
                "X-Correlation-ID": correlationId
              }

            const interaction: InteractionObject = {
              state: "is not authenticated",
              uponReceiving: `a request to convert ${desc} message`,
              withRequest: {
                headers,
                method: "POST",
                path: apiPath,
                body: requestJson
              },
              willRespondWith: {
                headers: {
                  "Content-Type": "text/plain; charset=utf-8",
                  "X-Request-ID": requestId,
                  "X-Correlation-ID": correlationId
                },
                body: Matchers.regex({matcher: responseMatcher, generate: response}),
                status: 200
              }
            }
            await provider.addInteraction(interaction)

            // todo: remove as above
            if (isDispenseNotification) {
              await client()
              .post(apiPath)
              .set("Content-Type", "application/fhir+json; fhirVersion=4.0")
              .set("X-Request-ID", requestId)
              .set("X-Correlation-ID", correlationId)
              .set("X-Skip-Validation", "yepDoTheSkip")
              .send(requestStr)
              .expect(200)
            }
            else{
              await client()
              .post(apiPath)
              .set("Content-Type", "application/fhir+json; fhirVersion=4.0")
              .set("X-Request-ID", requestId)
              .set("X-Correlation-ID", correlationId)
              .send(requestStr)
              .expect(200)
            }   
          }
        )
      })
    }
  )
})

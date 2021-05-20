import {InteractionObject} from "@pact-foundation/pact"
import * as jestpact from "jest-pact"
import supertest from "supertest"
import * as LosslessJson from "lossless-json"
import * as uuid from "uuid"
import * as TestResources from "../../resources/test-resources"
import {basePath, pactOptions} from "../../resources/common"
import {fhir} from "@models"

jestpact.pactWith(
  pactOptions("live", "task", "release"),
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async (provider: any) => {
    const client = () => {
      const url = provider.mockService.baseUrl
      return supertest(url)
    }

    describe("dispense interactions", () => {
      test.each(TestResources.taskReleaseCases)(
        "should be able to acquire prescription info on a prescription release",
        async (description: string, request: fhir.Parameters, response: fhir.Bundle, statusCode: number) => {
          const apiPath = `${basePath}/Task/$release`
          const requestStr = LosslessJson.stringify(request)
          const requestId = uuid.v4()
          const correlationId = uuid.v4()

          // only nominated pharmacy release request interaction is implemented atm
          const isNominatedPharmacyRelease =
            request.parameter.filter(isIdentifierParameter).filter(parameter => parameter.name === "owner").length > 0

          function isIdentifierParameter(parameter: fhir.Parameter): parameter is fhir.IdentifierParameter {
            return (parameter as fhir.IdentifierParameter).valueIdentifier !== undefined
          }

          const interaction: InteractionObject = {
            state: "is authenticated",
            uponReceiving: `a request to release a ${description} message`,
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
                "Content-Type": "application/json",
                "X-Request-ID": requestId,
                "X-Correlation-ID": correlationId
              },
              body: isNominatedPharmacyRelease ? response : undefined,
              status: isNominatedPharmacyRelease ? statusCode : 400
            }
          }

          await provider.addInteraction(interaction)
          await client()
            .post(apiPath)
            .set("Content-Type", "application/fhir+json; fhirVersion=4.0")
            .set("X-Request-ID", requestId)
            .set("X-Correlation-ID", correlationId)
            .send(requestStr)
            .expect(isNominatedPharmacyRelease ? statusCode : 400)
        }
      )
    })
  }
)

jestpact.pactWith(
  pactOptions("live", "task", "return"),
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async (provider: any) => {
    const client = () => {
      const url = `${provider.mockService.baseUrl}`
      return supertest(url)
    }

    describe("Task return e2e tests", () => {
      test.each(TestResources.taskReturnCases)(
        "should be able to process %s",
        async (desc: string, message: fhir.Task) => {
          const apiPath = `${basePath}/Task`
          const messageStr = LosslessJson.stringify(message)
          const requestId = uuid.v4()
          const correlationId = uuid.v4()

          const interaction: InteractionObject = {
            state: "is authenticated",
            uponReceiving: `a request to return ${desc} message`,
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
              body: {
                "resourceType": "OperationOutcome",
                "issue": [
                  {
                    "code": "informational",
                    "severity": "information"
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
            .send(messageStr)
            .expect(200)
        }
      )
    })
  }
)

jestpact.pactWith(
  pactOptions("live", "task", "withdraw"),
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async (provider: any) => {
    const client = () => {
      const url = `${provider.mockService.baseUrl}`
      return supertest(url)
    }

    describe("Task withdraw e2e tests", () => {
      test.each(TestResources.taskWithdrawCases)(
        "should be able to withdraw %s",
        async (desc: string, message: fhir.Task) => {
          const apiPath = `${basePath}/Task`
          const messageStr = LosslessJson.stringify(message)
          const requestId = uuid.v4()
          const correlationId = uuid.v4()

          const interaction: InteractionObject = {
            state: "is authenticated",
            uponReceiving: `a request to withdraw ${desc} message`,
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
              body: {
                "resourceType": "OperationOutcome",
                "issue": [
                  {
                    "code": "informational",
                    "severity": "information"
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
            .send(messageStr)
            .expect(200)
        }
      )
    })
  }
)

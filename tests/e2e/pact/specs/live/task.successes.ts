import {basePath, getHeaders, pactOptions} from "../../resources/common"
import {InteractionObject} from "@pact-foundation/pact"
import {Pact} from '@pact-foundation/pact'
import * as TestResources from "../../resources/test-resources"
import * as LosslessJson from "lossless-json"
import {fhir} from "@models"

const releaseProvider = new Pact(pactOptions("live", "task", "release"))

describe("dispense interactions", () => {
  test.each(TestResources.taskReleaseCases)(
    "should be able to acquire prescription info on a prescription release",
    async (description: string, request: fhir.Parameters, response: fhir.Bundle, statusCode: number) => {
      releaseProvider.setup().then(async() => {
        const apiPath = `${basePath}/Task/$release`
        const requestStr = LosslessJson.stringify(request)

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
            headers: getHeaders(),
            method: "POST",
            path: apiPath,
            body: JSON.parse(requestStr)
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/json"
            },
            body: isNominatedPharmacyRelease ? JSON.stringify(response) : undefined,
            status: isNominatedPharmacyRelease ? statusCode : 400
          }
        }

        await releaseProvider.addInteraction(interaction)
        await releaseProvider.writePact()
      })
    }
  )
})

const returnProvider = new Pact(pactOptions("live", "task", "return"))

describe("Task return e2e tests", () => {
  test.each(TestResources.taskReturnCases)(
    "should be able to process %s",
    async (desc: string, message: fhir.Task) => {
      releaseProvider.setup().then(async() => {
        const apiPath = `${basePath}/Task`
        const messageStr = LosslessJson.stringify(message)

        const interaction: InteractionObject = {
          state: "is authenticated",
          uponReceiving: `a request to return ${desc} message`,
          withRequest: {
            headers: getHeaders(),
            method: "POST",
            path: apiPath,
            body: JSON.parse(messageStr)
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/json"
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
        await returnProvider.addInteraction(interaction)
        await returnProvider.writePact()
      })
    }
  )
})

const withdrawProvider = new Pact(pactOptions("live", "task", "withdraw"))

describe("Task withdraw e2e tests", () => {
  test.each(TestResources.taskWithdrawCases)(
    "should be able to withdraw %s",
    async (desc: string, message: fhir.Task) => {
      withdrawProvider.setup().then(async() => {
        const apiPath = `${basePath}/Task`
        const messageStr = LosslessJson.stringify(message)

        const interaction: InteractionObject = {
          state: "is authenticated",
          uponReceiving: `a request to withdraw ${desc} message`,
          withRequest: {
            headers: getHeaders(),
            method: "POST",
            path: apiPath,
            body: JSON.parse(messageStr)
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/json",
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
        await withdrawProvider.addInteraction(interaction)
        await withdrawProvider.writePact()
      })
    }
  )
})
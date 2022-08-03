import {basePath, getHeaders, pactOptions, successfulOperationOutcome} from "../../resources/common"
import {InteractionObject} from "@pact-foundation/pact"
import {Pact} from '@pact-foundation/pact'
import * as TestResources from "../../resources/test-resources"
import * as LosslessJson from "lossless-json"
import {fhir} from "@models"

const claimProvider = new Pact(pactOptions("live", "claim"))

describe("claim e2e tests", () => {
  test.each(TestResources.claimCases)(
    "should be able to claim for %s",
    async (desc: string, message: fhir.Claim) => {
      claimProvider.setup().then(async() => {
        const apiPath = `${basePath}/Claim`
        const claimStr = LosslessJson.stringify(message)
        const claim = JSON.parse(claimStr) as fhir.Claim

        const interaction: InteractionObject = {
          state: "is authenticated",
          uponReceiving: `a request to claim for prescription: ${desc} message to Spine`,
          withRequest: {
            headers: getHeaders(),
            method: "POST",
            path: apiPath,
            body: JSON.stringify(claim)
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
        await claimProvider.addInteraction(interaction)
        await claimProvider.writePact()
      })
    }
  )
})

const claimAmendProvider = new Pact(pactOptions("live", "claim", "amend"))

describe("claim amend e2e tests", () => {
  test.each(TestResources.claimAmendCases)(
    "should be able to claim amend for %s",
    async (desc: string, message: fhir.Claim) => {
      claimAmendProvider.setup().then(async() => {
        const apiPath = `${basePath}/Claim`
        const claimStr = LosslessJson.stringify(message)
        const claim = JSON.parse(claimStr) as fhir.Claim

        const interaction: InteractionObject = {
          state: "is authenticated",
          uponReceiving: `a request to claim for prescription: ${desc} message to Spine`,
          withRequest: {
            headers: getHeaders(),
            method: "POST",
            path: apiPath,
            body: JSON.stringify(claim)
          },
          willRespondWith: {
            headers: {
              "Content-Type": "application/json"
            },
            body: successfulOperationOutcome,
            status: 200
          }
        }
        await claimAmendProvider.addInteraction(interaction)
        await claimAmendProvider.writePact()
      })
    }
  )
})
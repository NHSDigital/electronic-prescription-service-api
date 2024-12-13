import {InteractionObject, Pact} from "@pact-foundation/pact"
import {
  basePath,
  CreatePactOptions,
  getHeaders,
  pactOptions
} from "../../resources/common"
import * as uuid from "uuid"
import {createUnauthorisedInteraction} from "./auth"
import * as LosslessJson from "lossless-json"
import {fetcher, fhir} from "@models"
import * as TestResources from "../../resources/test-resources"
import {updatePrescriptions} from "../../services/update-prescriptions"
import {generateTestOutputFile} from "../../services/genereate-test-output-file"
import pino from "pino"
import {iso8601DateTime} from "@pact-foundation/pact/src/dsl/matchers"

const logger = pino()
const apiPath = `${basePath}/$process-message`
const authenticationTestDescription = "a request to process an unauthorised message"

beforeAll(async () => {
  if (process.env.UPDATE_PRESCRIPTIONS !== "false") {
    await updatePrescriptions(
      fetcher.prescriptionOrderExamples.filter((e) => !e.isSuccess),
      [],
      [],
      [],
      [],
      [],
      logger
    )
  }
  await generateTestOutputFile()
})

describe("endpoint authentication e2e tests", () => {
  test(authenticationTestDescription, async () => {
    const options = new CreatePactOptions("proxygen", "process", "send")
    const provider = new Pact(pactOptions(options))
    await provider.setup()
    const apiPath = `${basePath}/$process-message`
    const interaction: InteractionObject = createUnauthorisedInteraction(authenticationTestDescription, apiPath)
    await provider.addInteraction(interaction)
    await provider.writePact()
    await provider.finalize()
  })
})

describe("ensure errors are translated", () => {
  test("EPS Prescribe error 0003", async () => {
    const message = TestResources.prepareCaseBundles[0][1] as fhir.Bundle
    const messageClone = LosslessJson.parse(LosslessJson.stringify(message)) as fhir.Bundle
    messageClone.identifier.value = uuid.v4().toUpperCase()
    const bundleStr = LosslessJson.stringify(messageClone)
    const bundle = JSON.parse(bundleStr) as fhir.Bundle

    const requestId = uuid.v4()
    const correlationId = uuid.v4()

    const firstMedicationRequest = messageClone.entry
      .map((e) => e.resource)
      .find((r) => r.resourceType === "MedicationRequest") as fhir.MedicationRequest
    const prescriptionId = firstMedicationRequest.groupIdentifier.value

    const options = new CreatePactOptions("proxygen", "process", "send")
    const provider = new Pact(pactOptions(options))
    await provider.setup()

    const interaction: InteractionObject = {
      state: "is authenticated",
      uponReceiving: `a request to process prescription: ${prescriptionId} - No digital signature message to Spine`,
      withRequest: {
        headers: {
          ...getHeaders(),
          "Content-Type": "application/fhir+json; fhirVersion=4.0",
          "X-Request-ID": requestId,
          "X-Correlation-ID": correlationId
        },
        method: "POST",
        path: apiPath,
        body: LosslessJson.stringify(bundle)
      },
      willRespondWith: {
        headers: {
          "Content-Type": "application/fhir+json; fhirVersion=4.0"
        },
        body: {
          resourceType: "OperationOutcome",
          meta: {
            lastUpdated: iso8601DateTime()
          },
          issue: [
            {
              code: "business-rule",
              severity: "error",
              details: {
                coding: [
                  {
                    system: "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode",
                    code: "MISSING_DIGITAL_SIGNATURE",
                    display: "Digital signature not found"
                  }
                ]
              }
            }
          ]
        },
        status: 400
      }
    }
    await provider.addInteraction(interaction)
    await provider.writePact()
    await provider.finalize()
  })

  test.each(TestResources.processErrorCases)(
    "returns correct status code and body for %p",
    async (
      _: string,
      request: fhir.Bundle,
      response: fhir.OperationOutcome,
      statusCode: number,
      statusText: string
    ) => {
      const bundleStr = LosslessJson.stringify(request)

      const requestId = uuid.v4()
      const correlationId = uuid.v4()

      let firstMedicationRequest = request.entry
        .map((e) => e.resource)
        .find((r) => r.resourceType === "MedicationRequest") as fhir.MedicationRequest

      if (!firstMedicationRequest) {
        const firstMedicationDispense = request.entry
          .map((e) => e.resource)
          .find((r) => r.resourceType === "MedicationDispense") as fhir.MedicationDispense
        firstMedicationRequest = firstMedicationDispense.contained.find(
          (r) => r.resourceType === "MedicationRequest"
        ) as fhir.MedicationRequest
      }

      const prescriptionId = firstMedicationRequest.groupIdentifier.value

      const operationOutcomeWithLastUpdated = {
        resourceType: "OperationOutcome",
        meta: {
          lastUpdated: iso8601DateTime()
        },
        issue: response?.issue
      }

      const options = new CreatePactOptions("proxygen", "process", "send")
      const provider = new Pact(pactOptions(options))
      await provider.setup()

      const interaction: InteractionObject = {
        state: "is authenticated",
        uponReceiving: `a failed request (${statusText}) to process prescription: ${prescriptionId}`,
        withRequest: {
          headers: {
            ...getHeaders(),
            "Content-Type": "application/fhir+json; fhirVersion=4.0",
            "X-Request-ID": requestId,
            "X-Correlation-ID": correlationId
          },
          method: "POST",
          path: apiPath,
          body: JSON.parse(bundleStr)
        },
        willRespondWith: {
          headers: {
            "Content-Type": "application/fhir+json; fhirVersion=4.0"
          },
          body:
            response && response.meta
              ? LosslessJson.stringify(operationOutcomeWithLastUpdated)
              : LosslessJson.stringify(response),
          status: statusCode
        }
      }
      await provider.addInteraction(interaction)
      await provider.writePact()
      await provider.finalize()
    }
  )
})

test.skip("should reject a message with an invalid SDS Role Profile ID", async () => {
  const message = TestResources.processOrderCases[0][1]
  const bundleStr = LosslessJson.stringify(message)
  const bundle = JSON.parse(bundleStr) as fhir.Bundle
  const requestId = uuid.v4()
  const correlationId = uuid.v4()
  const options = new CreatePactOptions("proxygen", "process", "send")
  const provider = new Pact(pactOptions(options))
  await provider.setup()
  const interaction: InteractionObject = {
    state: "is authenticated",
    uponReceiving: `a request with an invalid SDS Role Profile ID`,
    withRequest: {
      headers: {
        ...getHeaders(),
        "Content-Type": "application/fhir+json; fhirVersion=4.0",
        "X-Request-ID": requestId,
        "X-Correlation-ID": correlationId,
        "NHSD-Session-URID": "invalid"
      },
      method: "POST",
      path: apiPath,
      body: LosslessJson.stringify(bundle)
    },
    willRespondWith: {
      headers: {
        "Content-Type": "application/fhir+json; fhirVersion=4.0"
      },
      body: {
        resourceType: "OperationOutcome",
        meta: {
          lastUpdated: "2022-10-21T13:47:00+00:00"
        },
        issue: [
          {
            severity: "error",
            code: "value",
            details: {
              coding: [
                {
                  system: "https://fhir.nhs.uk/R4/CodeSystem/Spine-ErrorOrWarningCode",
                  version: "1",
                  code: "INVALID_VALUE",
                  display: "Provided value is invalid"
                }
              ]
            },
            diagnostics: "Invalid value - 'invalid' in header 'NHSD-Session-URID'"
          }
        ]
      },
      status: 400
    }
  }
  await provider.addInteraction(interaction)
  await provider.writePact()
  await provider.finalize()
})

import Hapi from "@hapi/hapi"
import * as uuid from "uuid"
import HapiPino from "hapi-pino"
import * as TestResources from "../../resources/test-resources"
import {externalValidator, validator, VALIDATOR_HOST} from "../../../src/routes/util"
import axios from "axios"
import * as moxios from "moxios"
import {fhir} from "@models"
import {getMedicationRequests} from "../../../src/services/translation/common/getResourcesOfType"

let server: Hapi.Server

beforeAll(async () => {
  process.env.PRESCRIBE_ENABLED = "true"
  process.env.DISPENSE_ENABLED = "true"
  process.env.ODS_URL = "directory.spineservices.nhs.uk"
  server = Hapi.server({
    routes: {
      payload: {
        parse: false
      }
    }
  })
  server.route({
    method: "POST",
    path: "/$convert",
    handler: externalValidator(validator())
  })
  await server.register({
    plugin: HapiPino,
    options: {
      prettyPrint: false
    }
  })
  await server.start()

})

afterAll(async () => {
  await server.stop()
  process.env.PRESCRIBE_ENABLED = ""
  process.env.DISPENSE_ENABLED = ""
  process.env.ODS_URL = ""

})

beforeEach(() => {
  moxios.install(axios)
})

afterEach(() => {
  moxios.uninstall(axios)
})

describe("conversion happy path tests", () => {
  test.each(TestResources.convertSuccessExamples)(
    "should be able to convert %s message to HL7V3",
    async (_: string, request: unknown, response: string, responseMatcher: string) => {

      const regex = new RegExp(responseMatcher)
      const isMatch = regex.test(response)
      expect(isMatch).toBe(true)

      mockExternalValidatorResponses(request)

      const requestId = uuid.v4()
      const actual = await server.inject({
        method: "POST",
        url: "/$convert",
        headers: {
          "Content-Type": "application/fhir+json; fhirVersion=4.0",
          "X-Request-ID": requestId,
          "X-Correlation-ID": uuid.v4(),
          "nhsd-request-id": requestId
        },
        payload: JSON.stringify(request)
      })

      expect(actual.statusCode).toBe(200)
      const convertMatchesExpectation = regex.test(actual.payload)
      expect(convertMatchesExpectation).toBe(true)

    },
    120000
  )
})

describe("conversion unhappy path tests", () => {
  test.skip.each(TestResources.convertFailureExamples)(
    "should fail to convert %s message to HL7V3",
    async (_: string, request: unknown, response: string) => {

      mockExternalValidatorResponses(request)

      const requestId = uuid.v4()
      const actual = await server.inject({
        method: "POST",
        url: "/$convert",
        headers: {
          "Content-Type": "application/fhir+json; fhirVersion=4.0",
          "X-Request-ID": requestId,
          "X-Correlation-ID": uuid.v4(),
          "nhsd-request-id": requestId
        },
        payload: JSON.stringify(request)
      })

      expect(actual.statusCode).toBe(400)
      expect(actual.payload).toBe(response)
    }
  )
})

function mockExternalValidatorResponses(request: unknown) {
  const bundle = request as fhir.Bundle

  if (bundle.entry && getMedicationRequests(bundle).length > 4) {
    moxios.stubRequest(`${VALIDATOR_HOST}/$validate`, {
      status: 200,
      responseText: JSON.stringify(tooManyMedicationRequestsError)
    })
  } else {
    moxios.stubRequest(`${VALIDATOR_HOST}/$validate`, {
      status: 200,
      responseText: JSON.stringify({
        "resourceType": "OperationOutcome",
        "issue": []
      })
    })
  }
}

const tooManyMedicationRequestsError = (): fhir.OperationOutcome => ({
  resourceType: "OperationOutcome",
  issue: [{
    severity: "error",
    code: fhir.IssueCodes.PROCESSING,
    diagnostics: `Bundle contains too many resources of type MedicationRequest. Expected at most 4.`,
    expression: [
      "Bundle.entry"
    ]
  }]
})

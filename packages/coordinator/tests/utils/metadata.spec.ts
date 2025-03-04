import pino from "pino"
import {getCapabilityStatement} from "../../src/utils/metadata"

const logger = pino()

const testCases = [
  {
    "proxyHeaderValue": "fhir-prescribing--internal-dev--fhir-prescribing",
    "isEpsHostedContainer": "true",
    "expectedName": "FHIR Prescribing API",
    "expectedId": "apim-fhir-prescribing-service",
    "scenarioDescription": "should return correct details for prescribing in eps hosted container"
  },
  {
    "proxyHeaderValue": "fhir-dispensing--internal-dev--fhir-dispensing",
    "isEpsHostedContainer": "true",
    "expectedName": "FHIR Dispensing API",
    "expectedId": "apim-fhir-dispensing-service",
    "scenarioDescription": "should return correct details for dispensing in eps hosted container"
  },
  {
    "proxyHeaderValue": "",
    "isEpsHostedContainer": "false",
    "expectedName": "EPS FHIR API",
    "expectedId": "apim-electronic-prescription-service",
    "scenarioDescription": "should return correct details for non eps hosted container"
  },
  {
    "proxyHeaderValue": "foo-bar",
    "isEpsHostedContainer": "true",
    "expectedName": "FHIR Dispensing API",
    "expectedId": "apim-fhir-dispensing-service",
    // eslint-disable-next-line max-len
    "scenarioDescription": "should return correct details for dispensing in eps hosted container when no application name can be retrieved"
  }
]

test.each(testCases)(
  "$scenarioDescription",
  (testCase) => {
    const proxyHeader = {
      "apiproxy": testCase.proxyHeaderValue
    }
    process.env.MTLS_SPINE_CLIENT = testCase.isEpsHostedContainer
    const capabilityStatement = getCapabilityStatement(logger, proxyHeader)
    expect(capabilityStatement.name).toBe(testCase.expectedName)
    expect(capabilityStatement.id).toBe(testCase.expectedId)
    expect(capabilityStatement.software.name).toBe(testCase.expectedName)
  }
)

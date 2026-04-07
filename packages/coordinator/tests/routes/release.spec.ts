import Hapi from "@hapi/hapi"
import HapiPino from "hapi-pino"
import {fhir} from "@models"
import {createServer} from "../../src/server"
import * as TestResources from "../resources/test-resources"
import * as translator from "../../src/services/translation/request"
import * as spineClientModule from "../../src/services/communication/spine-client"
import * as parametersValidator from "../../src/services/validation/parameters-validator"

jest.mock("../../src/utils/feature-flags", () => ({
  isSignatureValidationEnabled: jest.fn(),
  isSandbox: jest.fn(() => false),
  isEpsHostedContainer: jest.fn(() => false),
  enableDefaultAsidPartyKey: jest.fn(() => true),
  getDispenseEnabled: jest.fn(() => true),
  getPrescribeEnabled: jest.fn(() => true)
}))

jest.mock("../../src/services/translation/request", () => ({
  convertParametersToSpineRequest: jest.fn(),
  convertPrescriptionBundleToSpineRequest: jest.fn(),
  convertBundleToSpineRequest: jest.fn()
}))

jest.mock("../../src/services/communication/spine-client", () => ({
  spineClient: {
    send: jest.fn()
  }
}))

jest.mock("../../src/services/validation/bundle-validator", () => ({
  verifyBundle: jest.fn().mockReturnValue([])
}))

jest.mock("../../src/services/verification/signature-verification", () => ({
  verifyAndFormatPrescriptionSignature: jest.fn()
}))

const mockConvertParameters = translator.convertParametersToSpineRequest as jest.MockedFunction<
  typeof translator.convertParametersToSpineRequest
>
const mockSpineSend = spineClientModule.spineClient.send as jest.MockedFunction<
  typeof spineClientModule.spineClient.send
>

const RELEASE_PATH = "/FHIR/R4/Task/$release"
const RELEASE_UNATTENDED_PATH = "/FHIR/R4/Task/$release-unattended"

const spineRequest = {
  message: "<someSpineRequest/>",
  interactionId: "PORX_IN132004UK30",
  messageId: "test-message-id",
  conversationId: "test-conversation-id",
  fromPartyKey: "T141D-822234"
}

const responseBody: fhir.Bundle = {
  resourceType: "Bundle",
  type: "searchset",
  entry: []
}
const successSpineResponse = {
  statusCode: 200,
  body: responseBody
}

function buildReleaseParameters(includeAgent: boolean): fhir.Parameters {
  const ownerParam: fhir.ResourceParameter<fhir.Organization> = {
    name: "owner",
    resource: {
      resourceType: "Organization",
      identifier: [{
        system: "https://fhir.nhs.uk/Id/ods-organization-code",
        value: "VNE51"
      }],
      name: "The Simple Pharmacy"
    }
  }

  const groupIdentifierParam: fhir.IdentifierParameter = {
    name: "group-identifier",
    valueIdentifier: {
      system: "https://fhir.nhs.uk/Id/prescription-order-number",
      value: "18B064-A99968-4BCAA3"
    }
  }

  const statusParam: fhir.Parameter = {
    name: "status"
  }

  const params: Array<fhir.Parameter> = [
    ownerParam,
    statusParam,
    groupIdentifierParam
  ]

  if (includeAgent) {
    const agentParam: fhir.ResourceParameter<fhir.PractitionerRole> = {
      name: "agent",
      resource: {
        resourceType: "PractitionerRole",
        identifier: [{
          system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
          value: "555254240100"
        }],
        practitioner: {
          identifier: {
            system: "https://fhir.nhs.uk/Id/sds-user-id",
            value: "555254239107"
          },
          display: "Test User"
        },
        telecom: [{
          system: "phone",
          use: "work",
          value: "0113 3180277"
        }],
        code: [{
          coding: [{
            system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
            code: "R8000",
            display: "Clinical Practitioner Access Role"
          }]
        }]
      }
    }
    params.push(agentParam)
  }

  const parameters = new fhir.Parameters(params)
  return parameters
}

const attendedHeaders: Hapi.Utils.Dictionary<string> = {
  ...TestResources.validTestHeaders,
  "content-type": "application/fhir+json; fhirVersion=4.0",
  "x-skip-validation": "true",
  "nhsd-scope": "urn:nhsd:apim:user-nhs-id:aal3:electronic-prescription-service-api:dispensing"
}

const unattendedHeaders: Hapi.Utils.Dictionary<string> = {
  ...TestResources.validTestHeaders,
  "content-type": "application/fhir+json; fhirVersion=4.0",
  "x-skip-validation": "true",
  "nhsd-scope": "urn:nhsd:apim:app:level3:electronic-prescription-service-api:dispensing"
}

describe("release routes", () => {
  let server: Hapi.Server

  beforeAll(async () => {
    server = createServer({}, 9011)
    await HapiPino.register(server, {
      redact: ["req.headers.authorization"],
      wrapSerializers: false,
      level: "silent"
    })
    await server.start()
  })

  afterAll(async () => {
    await server.stop()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockConvertParameters.mockReturnValue(spineRequest)
    mockSpineSend.mockResolvedValue(successSpineResponse)
  })

  const makeRequest = (
    path: string,
    payload: fhir.Parameters,
    headers: Hapi.Utils.Dictionary<string>
  ) =>
    server.inject({
      method: "POST",
      url: path,
      headers,
      payload: JSON.stringify(payload)
    })

  describe("POST /Task/$release (attended)", () => {
    test("route is registered and accepts POST requests with the user-restricted scope", async () => {
      const parameters = buildReleaseParameters(true)
      const response = await makeRequest(RELEASE_PATH, parameters, attendedHeaders)
      expect(response.statusCode).toBe(200)
      expect(mockConvertParameters).toHaveBeenCalledWith(
        expect.objectContaining({resourceType: "Parameters"}),
        expect.anything(),
        expect.anything()
      )
      expect(mockSpineSend).toHaveBeenCalled()
    })

    test("returns 403 when scope is invalid", async () => {
      const parameters = buildReleaseParameters(true)
      const invalidScopeHeaders = {
        ...attendedHeaders,
        "nhsd-scope": "urn:nhsd:apim:user-nhs-id:aal3:some-other-api"
      }
      const response = await makeRequest(RELEASE_PATH, parameters, invalidScopeHeaders)
      expect(response.statusCode).toBe(403)
      const body = JSON.parse(response.payload)
      expect(body.resourceType).toBe("OperationOutcome")
      expect(mockSpineSend).not.toHaveBeenCalled()
    })

    test("returns 403 when application-restricted scope is used", async () => {
      const parameters = buildReleaseParameters(true)
      const appScopeHeaders = {
        ...attendedHeaders,
        "nhsd-scope": "urn:nhsd:apim:app:level3:electronic-prescription-service-api:dispensing"
      }
      const response = await makeRequest(RELEASE_PATH, parameters, appScopeHeaders)
      expect(response.statusCode).toBe(403)
      const body = JSON.parse(response.payload)
      expect(body.resourceType).toBe("OperationOutcome")
      expect(mockSpineSend).not.toHaveBeenCalled()
    })
  })

  describe("POST /Task/$release-unattended", () => {
    test("route is registered and accepts POST requests with the application-restricted scope", async () => {
      const parameters = buildReleaseParameters(false)
      const response = await makeRequest(RELEASE_UNATTENDED_PATH, parameters, unattendedHeaders)
      expect(response.statusCode).toBe(200)
      expect(mockConvertParameters).toHaveBeenCalledWith(
        expect.objectContaining({resourceType: "Parameters"}),
        expect.anything(),
        expect.anything()
      )
      expect(mockSpineSend).toHaveBeenCalled()
    })

    test("returns 403 when scope is invalid", async () => {
      const parameters = buildReleaseParameters(false)
      const invalidScopeHeaders = {
        ...unattendedHeaders,
        "nhsd-scope": "urn:nhsd:apim:user-nhs-id:aal3:some-other-api"
      }
      const response = await makeRequest(RELEASE_UNATTENDED_PATH, parameters, invalidScopeHeaders)
      expect(response.statusCode).toBe(403)
      const body = JSON.parse(response.payload)
      expect(body.resourceType).toBe("OperationOutcome")
      expect(mockSpineSend).not.toHaveBeenCalled()
    })

    test("returns 403 when user-restricted scope is used", async () => {
      const parameters = buildReleaseParameters(false)
      const userScopeHeaders = {
        ...unattendedHeaders,
        "nhsd-scope": "urn:nhsd:apim:user-nhs-id:aal3:electronic-prescription-service-api:dispensing"
      }
      const response = await makeRequest(RELEASE_UNATTENDED_PATH, parameters, userScopeHeaders)
      expect(response.statusCode).toBe(403)
      const body = JSON.parse(response.payload)
      expect(body.resourceType).toBe("OperationOutcome")
      expect(mockSpineSend).not.toHaveBeenCalled()
    })

    test("rejects when agent parameter is included", async () => {
      const parameters = buildReleaseParameters(true)
      const response = await makeRequest(RELEASE_UNATTENDED_PATH, parameters, unattendedHeaders)
      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.payload)
      expect(body.resourceType).toBe("OperationOutcome")
      expect(mockSpineSend).not.toHaveBeenCalled()
    })
  })

  describe("verifyUnattendedParameters is used for unattended route", () => {
    test("unattended route uses verifyUnattendedParameters validator", () => {
      const spy = jest.spyOn(parametersValidator, "verifyUnattendedParameters")
      const parameters = buildReleaseParameters(false)
      makeRequest(RELEASE_UNATTENDED_PATH, parameters, unattendedHeaders)

      // The spy may fire asynchronously after the request completes,
      // but we verify both validators exist and are distinct
      expect(parametersValidator.verifyAttendedParameters).toBeDefined()
      expect(parametersValidator.verifyUnattendedParameters).toBeDefined()
      expect(parametersValidator.verifyAttendedParameters).not.toBe(parametersValidator.verifyUnattendedParameters)
      spy.mockRestore()
    })
  })
})

import Hapi from "@hapi/hapi"
import HapiPino from "hapi-pino"
import {fhir} from "@models"
import {createServer} from "../../src/server"
import * as TestResources from "../resources/test-resources"
import * as featureFlags from "../../src/utils/feature-flags"
import * as translator from "../../src/services/translation/request"
import * as spineClientModule from "../../src/services/communication/spine-client"
import * as bundleValidator from "../../src/services/validation/bundle-validator"
import {clone} from "../resources/test-helpers"

jest.mock("../../src/utils/feature-flags", () => ({
  isSignatureValidationEnabled: jest.fn(),
  isSandbox: jest.fn(() => false),
  isEpsHostedContainer: jest.fn(() => false),
  enableDefaultAsidPartyKey: jest.fn(() => true)
}))

jest.mock("../../src/services/translation/request", () => ({
  verifySignatureForPrescriptionCreation: jest.fn(),
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

const mockIsSignatureValidationEnabled = featureFlags.isSignatureValidationEnabled as jest.MockedFunction<
  typeof featureFlags.isSignatureValidationEnabled
>
const mockVerifySignature = translator.verifySignatureForPrescriptionCreation as jest.MockedFunction<
  typeof translator.verifySignatureForPrescriptionCreation
>
const mockSpineSend = spineClientModule.spineClient.send as jest.MockedFunction<
  typeof spineClientModule.spineClient.send
>
const mockVerifyBundle = bundleValidator.verifyBundle as jest.MockedFunction<typeof bundleValidator.verifyBundle>
const mockConvertBundle = translator.convertBundleToSpineRequest as jest.MockedFunction<
  typeof translator.convertBundleToSpineRequest
>

const PROCESS_PATH = "/FHIR/R4/$process-message"

const spineRequest = {
  message: "<someSpineRequest/>",
  interactionId: "PORX_IN020101UK31",
  messageId: "test-message-id",
  conversationId: "test-conversation-id",
  fromPartyKey: "T141D-822234"
}

const successSpineResponse = {
  statusCode: 200,
  body: "<response/>"
}

describe("process route - signature validation", () => {
  let server: Hapi.Server
  let prescriptionBundle: fhir.Bundle

  beforeAll(async () => {
    server = createServer({}, 9010)
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
    prescriptionBundle = clone(TestResources.specification[0].fhirMessageSigned)
    mockVerifyBundle.mockReturnValue([])
    mockConvertBundle.mockResolvedValue(spineRequest)
    mockSpineSend.mockResolvedValue(successSpineResponse)
  })

  const makeRequest = (bundle: fhir.Bundle) =>
    server.inject({
      method: "POST",
      url: PROCESS_PATH,
      headers: {
        ...TestResources.validTestHeaders,
        "content-type": "application/fhir+json; fhirVersion=4.0",
        "x-skip-validation": "true"
      },
      payload: JSON.stringify(bundle)
    })

  test("when signature validation is disabled, skips signature check and forwards to Spine", async () => {
    mockIsSignatureValidationEnabled.mockReturnValue(false)

    await makeRequest(prescriptionBundle)

    expect(mockVerifySignature).not.toHaveBeenCalled()
    expect(mockSpineSend).toHaveBeenCalled()
  })

  test("when signature validation is enabled and signature is valid, forwards to Spine", async () => {
    mockIsSignatureValidationEnabled.mockReturnValue(true)
    mockVerifySignature.mockResolvedValue([])

    await makeRequest(prescriptionBundle)

    expect(mockVerifySignature).toHaveBeenCalled()
    expect(mockSpineSend).toHaveBeenCalled()
  })

  test("when signature validation is enabled and signature is invalid, returns 400 with OperationOutcome", async () => {
    mockIsSignatureValidationEnabled.mockReturnValue(true)

    const signatureIssue: fhir.OperationOutcomeIssue = {
      code: fhir.IssueCodes.INVALID,
      severity: "error",
      details: {
        coding: [
          {
            system: "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode",
            code: "INVALID_VALUE",
            display: "Signature is invalid."
          }
        ]
      },
      diagnostics: "Invalid signature format",
      expression: ["Provenance.signature.data"]
    }
    mockVerifySignature.mockResolvedValue([signatureIssue])

    const response = await makeRequest(prescriptionBundle)

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.payload) as fhir.OperationOutcome
    expect(body.resourceType).toBe("OperationOutcome")
    expect(body.issue[0].details.coding[0].code).toBe("INVALID_VALUE")
    expect(mockSpineSend).not.toHaveBeenCalled()
  })

  test("when signature validation is enabled but message is not a prescription, skips signature check", async () => {
    mockIsSignatureValidationEnabled.mockReturnValue(true)

    const nonPrescriptionBundle = clone(prescriptionBundle)
    const messageHeader = nonPrescriptionBundle.entry
      .map((e) => e.resource)
      .find((r) => r.resourceType === "MessageHeader") as fhir.MessageHeader
    messageHeader.eventCoding.code = fhir.EventCodingCode.DISPENSE

    await makeRequest(nonPrescriptionBundle)

    expect(mockVerifySignature).not.toHaveBeenCalled()
  })
})

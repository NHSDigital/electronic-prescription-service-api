import {vi, MockedFunction} from "vitest"
import Hapi from "@hapi/hapi"
import HapiPino from "hapi-pino"
import {fhir, hl7V3} from "@models"
import {createServer} from "../../src/server"
import * as TestResources from "../resources/test-resources"
import * as featureFlags from "../../src/utils/feature-flags"
import * as translator from "../../src/services/translation/request"
import * as signatureVerification from "../../src/services/verification/signature-verification"
import * as spineClientModule from "../../src/services/communication/spine-client"
import * as bundleValidator from "../../src/services/validation/bundle-validator"
import {clone} from "../resources/test-helpers"

vi.mock("../../src/utils/feature-flags", () => ({
  isSignatureValidationEnabled: vi.fn(),
  isSandbox: vi.fn(() => false),
  isEpsHostedContainer: vi.fn(() => false),
  enableDefaultAsidPartyKey: vi.fn(() => true)
}))

vi.mock("../../src/services/translation/request", () => ({
  convertPrescriptionBundleToSpineRequest: vi.fn(),
  convertBundleToSpineRequest: vi.fn()
}))

vi.mock("../../src/services/verification/signature-verification", () => ({
  verifyPrescriptionSignature: vi.fn()
}))

vi.mock("../../src/services/communication/spine-client", () => ({
  spineClient: {
    send: vi.fn()
  }
}))

vi.mock("../../src/services/validation/bundle-validator", () => ({
  verifyBundle: vi.fn().mockReturnValue([])
}))

const mockIsSignatureValidationEnabled = featureFlags.isSignatureValidationEnabled as MockedFunction<
  typeof featureFlags.isSignatureValidationEnabled
>
const mockConvertPrescriptionBundle = translator.convertPrescriptionBundleToSpineRequest as MockedFunction<
  typeof translator.convertPrescriptionBundleToSpineRequest
>
const mockVerifyPrescriptionSignature = signatureVerification.verifyPrescriptionSignature as MockedFunction<
  typeof signatureVerification.verifyPrescriptionSignature
>
const mockSpineSend = spineClientModule.spineClient.send as MockedFunction<
  typeof spineClientModule.spineClient.send
>
const mockVerifyBundle = bundleValidator.verifyBundle as MockedFunction<typeof bundleValidator.verifyBundle>
const mockConvertBundle = translator.convertBundleToSpineRequest as MockedFunction<
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
    vi.clearAllMocks()
    prescriptionBundle = clone(TestResources.specification[0].fhirMessageSigned)
    mockVerifyBundle.mockReturnValue([])
    mockConvertPrescriptionBundle.mockResolvedValue({
      spineRequest: spineRequest,
      parentPrescription: {
        _attributes: undefined,
        id: {_attributes: {root: "TEST-PRESCRIPTION-ID", extension: undefined}},
        code: undefined,
        effectiveTime: undefined,
        typeId: undefined,
        recordTarget: undefined,
        pertinentInformation1: undefined,
        pertinentInformation2: undefined
      } satisfies hl7V3.ParentPrescription
    })
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

    expect(mockConvertPrescriptionBundle).toHaveBeenCalled()
    expect(mockVerifyPrescriptionSignature).not.toHaveBeenCalled()
    expect(mockSpineSend).toHaveBeenCalled()
  })

  test("when signature validation is enabled and signature is valid, forwards to Spine", async () => {
    mockIsSignatureValidationEnabled.mockReturnValue(true)
    mockVerifyPrescriptionSignature.mockResolvedValue([])

    await makeRequest(prescriptionBundle)

    expect(mockConvertPrescriptionBundle).toHaveBeenCalled()
    expect(mockVerifyPrescriptionSignature).toHaveBeenCalledWith(
      expect.anything(), expect.anything()
    )
    expect(mockSpineSend).toHaveBeenCalled()
  })

  test("when signature validation is enabled and signature is invalid, returns 400 with OperationOutcome", async () => {
    mockIsSignatureValidationEnabled.mockReturnValue(true)
    mockVerifyPrescriptionSignature.mockResolvedValue(["Invalid signature format"])

    const response = await makeRequest(prescriptionBundle)

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.payload) as fhir.OperationOutcome
    expect(body.resourceType).toBe("OperationOutcome")
    expect(body.issue[0].code).toBe("invalid")
    expect(body.issue[0].diagnostics).toBe("Invalid signature format")
    expect(mockSpineSend).not.toHaveBeenCalled()
  })

  test("when signature validation is enabled but message is not a prescription, skips signature check", async () => {
    mockIsSignatureValidationEnabled.mockReturnValue(true)

    const nonPrescriptionBundle = clone(prescriptionBundle)
    const messageHeader = nonPrescriptionBundle.entry
      .map((e) => e.resource)
      .find((r) => r.resourceType === "MessageHeader") as fhir.MessageHeader
    messageHeader.eventCoding.code = fhir.EventCodingCode.DISPENSE
    mockConvertBundle.mockResolvedValue(spineRequest)

    await makeRequest(nonPrescriptionBundle)

    expect(mockConvertPrescriptionBundle).not.toHaveBeenCalled()
    expect(mockVerifyPrescriptionSignature).not.toHaveBeenCalled()
    expect(mockConvertBundle).toHaveBeenCalled()
  })
})

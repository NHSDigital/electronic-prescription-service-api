import {
  CancelResponseHandler,
  ReleaseRejectionHandler,
  ReleaseResponseHandler,
  SpineResponseHandler,
  TranslatedSpineResponse
} from "../../../../src/services/translation/response/spine-response-handler"
import pino from "pino"
import {fhir, hl7V3} from "@models"
import * as uuid from "uuid"
import * as moment from "moment"
import {convertMomentToHl7V3DateTime} from "../../../../src/services/translation/common/dateTime"
import {writeXmlStringPretty} from "../../../../src/services/serialisation/xml"
import {TelecomUse} from "../../../../../models/hl7-v3"

import {DispensePropsalReturnHandler} from "../../../../src/services/translation/response/spine-return-handler"
import {
  DispenseReturnPayloadFactory
} from "../../../../src/services/translation/request/return/payload/return-payload-factory"
import {validTestHeaders} from "../../../resources/test-resources"
import {spineClient} from "../../../../src/services/communication/spine-client"
const logger = pino()

describe("default handler", () => {
  const defaultHandler = new SpineResponseHandler("MCCI_IN010000UK13")

  test("extractSendMessagePayload returns null if spine response doesn't match regex", () => {
    const expectedSendMessagePayload = createSuccess("MCCI_IN010000UK13", undefined)
    const spineResponse = writeXmlStringPretty({MCCI_SOMETHING_ELSE: expectedSendMessagePayload})
    const result = defaultHandler.extractSendMessagePayload(spineResponse)
    expect(result).toBeNull()
  })

  test("extractSendMessagePayload returns payload if spine response matches regex", () => {
    const expectedSendMessagePayload = createSuccess("MCCI_IN010000UK13", undefined)
    const spineResponse = writeXmlStringPretty({MCCI_IN010000UK13: expectedSendMessagePayload})
    const actualSendMessagePayload = defaultHandler.extractSendMessagePayload(spineResponse)
    expect(expectedSendMessagePayload).toMatchObject(actualSendMessagePayload)
  })

  test("handleResponse returns null if spine response doesn't match regex", async () => {
    const expectedSendMessagePayload = createSuccess("MCCI_IN010000UK13", undefined)
    const spineResponse = writeXmlStringPretty({MCCI_SOMETHING_ELSE: expectedSendMessagePayload})
    const result = await defaultHandler.handleResponse(spineResponse, logger)
    expect(result).toBeNull()
  })

  async function checkResponseObjectAndStatusCode(
    expectedSendMessagePayload: hl7V3.SendMessagePayload<unknown>,
    expectedIssueArray: Array<fhir.OperationOutcomeIssue>,
    statusCode: number
  ) {
    const spineResponse = writeXmlStringPretty({MCCI_IN010000UK13: expectedSendMessagePayload})
    const result = await defaultHandler.handleResponse(spineResponse, logger)
    expect(result).toMatchObject({
      statusCode: statusCode,
      fhirResponse: {
        resourceType: "OperationOutcome",
        issue: expectedIssueArray
      }
    })
  }

  test("handleResponse returns 500 response if spine response has invalid acknowledgement type code", async () => {
    const expectedSendMessagePayload = createUnhandled("MCCI_IN010000UK13")
    const expectedIssueArray: Array<fhir.OperationOutcomeIssue> = [{code: fhir.IssueCodes.INVALID, severity: "error"}]
    await checkResponseObjectAndStatusCode(expectedSendMessagePayload, expectedIssueArray, 500)
  })

  test("handleResponse returns 500 response if spine response is a rejection and detail is missing", async () => {
    const expectedSendMessagePayload = createRejection("MCCI_IN010000UK13")
    const expectedIssueArray: Array<fhir.OperationOutcomeIssue> = [{code: fhir.IssueCodes.INVALID, severity: "error"}]
    await checkResponseObjectAndStatusCode(expectedSendMessagePayload, expectedIssueArray, 500)
  })

  test("handleResponse returns 400 response if spine response is a rejection (single detail)", async () => {
    const expectedSendMessagePayload = createRejection(
      "MCCI_IN010000UK13",
      createAcknowledgementDetail("RejectionCode", "Rejection Display Name")
    )
    const expectedIssueArray = [
      createErrorOperationOutcomeIssue(fhir.IssueCodes.INVALID, "RejectionCode", "Rejection Display Name")
    ]
    await checkResponseObjectAndStatusCode(expectedSendMessagePayload, expectedIssueArray, 400)
  })

  test("handleResponse returns 400 response if spine response is a rejection (multiple details)", async () => {
    const expectedSendMessagePayload = createRejection(
      "MCCI_IN010000UK13",
      createAcknowledgementDetail("RejectionCode1", "Rejection Display Name 1"),
      createAcknowledgementDetail("RejectionCode2", "Rejection Display Name 2")
    )
    const expectedIssueArray = [
      createErrorOperationOutcomeIssue(fhir.IssueCodes.INVALID, "RejectionCode1", "Rejection Display Name 1"),
      createErrorOperationOutcomeIssue(fhir.IssueCodes.INVALID, "RejectionCode2", "Rejection Display Name 2")
    ]
    await checkResponseObjectAndStatusCode(expectedSendMessagePayload, expectedIssueArray, 400)
  })

  test("handleResponse returns 500 response if spine response is an error and reason is missing", async () => {
    const expectedSendMessagePayload = createError("MCCI_IN010000UK13", undefined)
    const expectedIssueArray: Array<fhir.OperationOutcomeIssue> = [{code: fhir.IssueCodes.INVALID, severity: "error"}]
    await checkResponseObjectAndStatusCode(expectedSendMessagePayload, expectedIssueArray, 500)
  })

  const defaultErrorCases = [
    ["prescribe", hl7V3.ApplicationErrorMessageTypeCodes.PRESCRIBE, "RejectionCode", "ERROR"],
    ["dispense", hl7V3.ApplicationErrorMessageTypeCodes.DISPENSE, "RejectionCode", "ERROR"],
    ["spine", hl7V3.ApplicationErrorMessageTypeCodes.SPINE, "RejectionCode", "RejectionCode"]
  ]

  test.each(defaultErrorCases)("handleResponse returns 400 response if spine response is a %p error (single reason)",
    async (_, codeSystem: string, spineErrorCode: string, translatedErrorCode: string) => {
      const expectedSendMessagePayload = createError(
        "MCCI_IN010000UK13",
        undefined,
        createSendMessagePayloadReason(spineErrorCode, "Error Display Name", codeSystem)
      )
      const expectedIssueArray = [
        createErrorOperationOutcomeIssue(fhir.IssueCodes.INVALID, translatedErrorCode, "Error Display Name")
      ]
      await checkResponseObjectAndStatusCode(expectedSendMessagePayload, expectedIssueArray, 400)
    })

  test.each(defaultErrorCases)("handleResponse returns 400 response if spine response is a %p error (multiple reasons)",
    async (_, codeSystem: string, spineErrorCode: string, translatedErrorCode: string) => {
      const expectedSendMessagePayload = createError(
        "MCCI_IN010000UK13",
        undefined,
        createSendMessagePayloadReason(spineErrorCode, "Error Display Name 1", codeSystem),
        createSendMessagePayloadReason(spineErrorCode, "Error Display Name 2", codeSystem)
      )
      const expectedIssueArray = [
        createErrorOperationOutcomeIssue(fhir.IssueCodes.INVALID, translatedErrorCode, "Error Display Name 1"),
        createErrorOperationOutcomeIssue(fhir.IssueCodes.INVALID, translatedErrorCode, "Error Display Name 2")
      ]
      await checkResponseObjectAndStatusCode(expectedSendMessagePayload, expectedIssueArray, 400)
    })

  const specificErrorCases = [
    ["prescribe", hl7V3.ApplicationErrorMessageTypeCodes.PRESCRIBE, "PATIENT_DECEASED", "Patient is recorded as dead"],
    ["dispense", hl7V3.ApplicationErrorMessageTypeCodes.DISPENSE, "PRESCRIPTION_CANCELLED",
      "Prescription has been cancelled"]
  ]

  test.each(specificErrorCases)("handleResponse correctly translates '0001' %p error codes",
    async (_, codeSystem: string, translatedErrorCode: string, translatedErrorMessage: string) => {
      const expectedSendMessagePayload = createError(
        "MCCI_IN010000UK13",
        undefined,
        createSendMessagePayloadReason(
          "0001", "Anything goes here", codeSystem
        )
      )
      const expectedIssueArray = [
        createErrorOperationOutcomeIssue(fhir.IssueCodes.BUSINESS_RULE,
          translatedErrorCode,
          translatedErrorMessage,
          "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode")
      ]
      await checkResponseObjectAndStatusCode(expectedSendMessagePayload, expectedIssueArray, 400)
    })

  test("handleResponse returns 200 response if spine response is a success", async () => {
    const expectedSendMessagePayload = createSuccess("MCCI_IN010000UK13", undefined)
    const expectedIssueArray: Array<fhir.OperationOutcomeIssue> = [{
      code: fhir.IssueCodes.INFORMATIONAL,
      severity: "information"
    }]
    await checkResponseObjectAndStatusCode(expectedSendMessagePayload, expectedIssueArray, 200)
  })
})

describe("custom response handler", () => {
  const customResponse: TranslatedSpineResponse = {
    statusCode: 418,
    fhirResponse: {
      resourceType: "Patient"
    }
  }

  const rejectionOverride = jest.fn()
  const errorOverride = jest.fn()
  const successOverride = jest.fn()

  const customHandlerClass = class extends SpineResponseHandler<undefined> {
    protected handleRejectionResponse = rejectionOverride
    protected handleErrorResponse = errorOverride
    protected handleSuccessResponse = successOverride
  }

  const customHandler = new customHandlerClass("MCCI_IN010000UK13")

  test("handleResponse calls rejection override if spine response is a rejection", async () => {
    const expectedSendMessagePayload = createRejection(
      "MCCI_IN010000UK13",
      createAcknowledgementDetail("RejectionCode", "Rejection Display Name")
    )
    const spineResponse = writeXmlStringPretty({MCCI_IN010000UK13: expectedSendMessagePayload})
    rejectionOverride.mockReturnValueOnce(customResponse)
    const result = await customHandler.handleResponse(spineResponse, logger)
    expect(result).toBe(customResponse)
    expect(rejectionOverride).toHaveBeenCalled()
  })

  test("handleResponse calls error override if spine response is an error", async () => {
    const expectedSendMessagePayload = createError(
      "MCCI_IN010000UK13",
      undefined,
      createSendMessagePayloadReason("ErrorCode", "Error Display Name", "ErrorCodeSystem")
    )
    const spineResponse = writeXmlStringPretty({MCCI_IN010000UK13: expectedSendMessagePayload})
    errorOverride.mockReturnValueOnce(customResponse)
    const result = await customHandler.handleResponse(spineResponse, logger)
    expect(result).toBe(customResponse)
    expect(errorOverride).toHaveBeenCalled()
  })

  test("handleResponse calls success override if spine response is a success", async () => {
    const expectedSendMessagePayload = createSuccess("MCCI_IN010000UK13", undefined)
    const spineResponse = writeXmlStringPretty({MCCI_IN010000UK13: expectedSendMessagePayload})
    successOverride.mockReturnValueOnce(customResponse)
    const result = await customHandler.handleResponse(spineResponse, logger)
    expect(result).toBe(customResponse)
    expect(successOverride).toHaveBeenCalled()
  })
})

describe("cancel response handler", () => {
  const mockTranslator = jest.fn()
  const cancelResponseHandler = new CancelResponseHandler("PORX_IN050101UK31", mockTranslator)
  const mockCancellationResponse = {}
  const mockCancellationResponseRoot = {CancellationResponse: mockCancellationResponse}
  const mockTranslatorResponse = {
    resourceType: "Bundle"
  }

  test("handleResponse returns 400 response if spine response is a rejection", async () => {
    const expectedSendMessagePayload = createRejection(
      "PORX_IN050101UK31",
      createAcknowledgementDetail("RejectionCode", "Rejection Display Name")
    )
    const spineResponse = writeXmlStringPretty({PORX_IN050101UK31: expectedSendMessagePayload})
    const result = await cancelResponseHandler.handleResponse(spineResponse, logger)
    expect(result).toMatchObject({
      statusCode: 400,
      fhirResponse: {
        resourceType: "OperationOutcome",
        issue: [createErrorOperationOutcomeIssue(fhir.IssueCodes.INVALID, "RejectionCode", "Rejection Display Name")]
      }
    })
  })

  test("handleResponse returns 400 response if spine response is an error", async () => {
    const expectedSendMessagePayload = createError(
      "PORX_IN050101UK31",
      mockCancellationResponseRoot,
      createSendMessagePayloadReason("ErrorCode", "Error Display Name", "ErrorCodeSystem")
    )
    const spineResponse = writeXmlStringPretty({PORX_IN050101UK31: expectedSendMessagePayload})
    mockTranslator.mockReturnValueOnce(mockTranslatorResponse)
    const result = await cancelResponseHandler.handleResponse(spineResponse, logger)
    expect(result).toEqual({
      statusCode: 400,
      fhirResponse: mockTranslatorResponse
    })
    expect(mockTranslator).toHaveBeenCalledWith(mockCancellationResponse)
  })

  test("handleResponse returns 200 response if spine response is a success", async () => {
    const expectedSendMessagePayload = createSuccess(
      "PORX_IN050101UK31",
      mockCancellationResponseRoot
    )
    const spineResponse = writeXmlStringPretty({PORX_IN050101UK31: expectedSendMessagePayload})
    mockTranslator.mockReturnValueOnce(mockTranslatorResponse)
    const result = await cancelResponseHandler.handleResponse(spineResponse, logger)
    expect(result).toEqual({
      statusCode: 200,
      fhirResponse: mockTranslatorResponse
    })
    expect(mockTranslator).toHaveBeenCalledWith(mockCancellationResponse)
  })
})

describe("release response handler", () => {
  const mockTranslator = jest.fn()
  const mockReturnFactory = {create: jest.fn()}
  const dispenseReturnPayloadFactory = new DispenseReturnPayloadFactory()
  const releaseResponseHandler = new ReleaseResponseHandler(
    "PORX_IN070101UK31",
    new DispensePropsalReturnHandler(
      validTestHeaders,
      dispenseReturnPayloadFactory,
      spineClient
    ),
    mockTranslator,
    mockReturnFactory)
  const mockReleaseResponse = {}
  const mockReleaseResponseRoot = {PrescriptionReleaseResponse: mockReleaseResponse}
  const mockTranslatorResponse = {
    translatedResponse : {resourceType: "Bundle"}
  }

  test("handleResponse returns 400 response if spine response is a rejection", async () => {
    const expectedSendMessagePayload = createRejection(
      "PORX_IN070101UK31",
      createAcknowledgementDetail("RejectionCode", "Rejection Display Name")
    )
    const spineResponse = writeXmlStringPretty({PORX_IN070101UK31: expectedSendMessagePayload})
    const result = await releaseResponseHandler.handleResponse(spineResponse, logger)
    expect(result).toMatchObject({
      statusCode: 400,
      fhirResponse: {
        resourceType: "OperationOutcome",
        issue: [createErrorOperationOutcomeIssue(fhir.IssueCodes.INVALID, "RejectionCode", "Rejection Display Name")]
      }
    })
  })

  test("handleResponse returns 400 response if spine response is an error", async () => {
    const expectedSendMessagePayload = createError(
      "PORX_IN070101UK31",
      mockReleaseResponseRoot,
      createSendMessagePayloadReason("ErrorCode", "Error Display Name", "ErrorCodeSystem")
    )
    const spineResponse = writeXmlStringPretty({PORX_IN070101UK31: expectedSendMessagePayload})
    const result = await releaseResponseHandler.handleResponse(spineResponse, logger)
    expect(result).toMatchObject({
      statusCode: 400,
      fhirResponse: {
        resourceType: "OperationOutcome",
        issue: [createErrorOperationOutcomeIssue(fhir.IssueCodes.INVALID, "ErrorCode", "Error Display Name")]
      }
    })
  })

  test("handleResponse returns 200 response if spine response is a success", async () => {
    const expectedSendMessagePayload = createSuccess(
      "PORX_IN070101UK31",
      mockReleaseResponseRoot
    )

    const spineResponse = writeXmlStringPretty({PORX_IN070101UK31: expectedSendMessagePayload})
    mockTranslator.mockReturnValueOnce(mockTranslatorResponse)
    const result = await releaseResponseHandler.handleResponse(spineResponse, logger)
    expect(result).toEqual({
      statusCode: 200,
      fhirResponse: {resourceType: "Bundle"}
    })
    expect(mockTranslator).toHaveBeenCalledWith(mockReleaseResponse, logger, mockReturnFactory)
  })
})

describe("release rejection handler", () => {
  const releaseRejectionHandler = new ReleaseRejectionHandler("PORX_IN110101UK30")

  test("handleResponse includes organization details on 0004", async () => {
    const expectedSendMessagePayload = createError(
      "PORX_IN110101UK30",
      createReleaseRejectSubject(new hl7V3.PrescriptionReleaseRejectionReason("0004"))
    )
    const spineResponse = writeXmlStringPretty({PORX_IN110101UK30: expectedSendMessagePayload})
    const result = await releaseRejectionHandler.handleResponse(spineResponse, logger)

    const outcomeIssue = createRejectionOperationOutcomeIssue(
      fhir.IssueCodes.BUSINESS_RULE,
      "PRESCRIPTION_WITH_ANOTHER_DISPENSER",
      "Prescription is with another dispenser"
    )
    const organization: fhir.Organization = {
      resourceType: "Organization",
      id: result.fhirResponse.contained[0].id,
      name: "FIVE STAR HOMECARE LEEDS LTD",
      telecom: [{use: "work", value: "02380798430"}],
      address: [
        {
          line: ["17 Austhorpe Road", "Crossgates", "Leeds", "West Yorkshire"],
          postalCode: "LS15 8BA",
          use: "work"
        }
      ],
      identifier: [{system: "https://fhir.nhs.uk/Id/ods-organization-code", value: "VNFKT"}]
    }
    const extension: fhir.ReferenceExtension<fhir.Bundle> = {
      url: "https://fhir.nhs.uk/StructureDefinition/Extension-Spine-supportingInfo",
      valueReference: {reference: `#${result.fhirResponse.contained[0].id}`}
    }
    const operationOutcome: fhir.OperationOutcome = {
      resourceType: "OperationOutcome",
      issue: [outcomeIssue],
      contained: [organization],
      extension: [extension]
    }
    expect(result).toMatchObject<TranslatedSpineResponse>({
      statusCode: 400,
      fhirResponse: operationOutcome
    })
  })

  test("handleResponse doesnt populate diagnostic info on other reason codes", async () => {
    const expectedSendMessagePayload = createError(
      "PORX_IN110101UK30",
      createReleaseRejectSubject(new hl7V3.PrescriptionReleaseRejectionReason("other reason code"))
    )
    const spineResponse = writeXmlStringPretty({PORX_IN110101UK30: expectedSendMessagePayload})
    const result = await releaseRejectionHandler.handleResponse(spineResponse, logger)
    const operationOutcome = result.fhirResponse as fhir.OperationOutcome
    expect(operationOutcome.issue[0].diagnostics).toBeUndefined()
  })

  test("handleResponse returns unknown when AgentPerson is missing", async () => {
    const expectedSendMessagePayload = createError(
      "PORX_IN110101UK30",
      createReleaseRejectSubject(new hl7V3.PrescriptionReleaseRejectionReason("0004"))
    )
    // eslint-disable-next-line max-len
    delete expectedSendMessagePayload.ControlActEvent.subject.PrescriptionReleaseReject.pertinentInformation.pertinentRejectionReason.performer
    const spineResponse = writeXmlStringPretty({PORX_IN110101UK30: expectedSendMessagePayload})
    const result = await releaseRejectionHandler.handleResponse(spineResponse, logger)

    const outcomeIssue = createRejectionOperationOutcomeIssue(
      fhir.IssueCodes.BUSINESS_RULE,
      "PRESCRIPTION_WITH_ANOTHER_DISPENSER",
      "Prescription is with another dispenser"
    )
    const organization: fhir.Organization = {
      resourceType: "Organization",
      id: result.fhirResponse.contained[0].id,
      name: "UNKNOWN",
      identifier: [{system: "https://fhir.nhs.uk/Id/ods-organization-code", value: "UNKNOWN"}]
    }
    const extension: fhir.ReferenceExtension<fhir.Bundle> = {
      url: "https://fhir.nhs.uk/StructureDefinition/Extension-Spine-supportingInfo",
      valueReference: {reference: `#${result.fhirResponse.contained[0].id}`}
    }
    const operationOutcome: fhir.OperationOutcome = {
      resourceType: "OperationOutcome",
      issue: [outcomeIssue],
      contained: [organization],
      extension: [extension]
    }
    expect(result).toMatchObject<TranslatedSpineResponse>({
      statusCode: 400,
      fhirResponse: operationOutcome
    })
  })

})

function createSendMessagePayload<T>(interactionId: string) {
  const id = new hl7V3.GlobalIdentifier(uuid.v4().toUpperCase())
  const timestamp = convertMomentToHl7V3DateTime(moment.utc())
  const interactionIdentifier = new hl7V3.Hl7InteractionIdentifier(interactionId)
  return new hl7V3.SendMessagePayload<T>(id, timestamp, interactionIdentifier)
}

function createRejection(interactionId: string, ...detail: Array<hl7V3.AcknowledgementDetail>) {
  const sendMessagePayload = createSendMessagePayload(interactionId)
  sendMessagePayload.acknowledgement = {
    _attributes: {
      typeCode: hl7V3.AcknowledgementTypeCode.REJECTED
    },
    acknowledgementDetail: detail
  }
  return sendMessagePayload
}

function createError<T>(interactionId: string, subject: T, ...reason: Array<hl7V3.SendMessagePayloadReason>) {
  const sendMessagePayload = createSendMessagePayload<T>(interactionId)
  sendMessagePayload.acknowledgement = {
    _attributes: {
      typeCode: hl7V3.AcknowledgementTypeCode.ERROR
    }
  }
  const controlActEvent = new hl7V3.ControlActEvent<T>()
  controlActEvent.reason = reason
  controlActEvent.subject = subject
  sendMessagePayload.ControlActEvent = controlActEvent
  return sendMessagePayload
}

function createSuccess<T>(interactionId: string, subject: T) {
  createSendMessagePayload(interactionId)
  const sendMessagePayload = createSendMessagePayload<T>(interactionId)
  sendMessagePayload.acknowledgement = {
    _attributes: {
      typeCode: hl7V3.AcknowledgementTypeCode.ACKNOWLEDGED
    }
  }
  const controlActEvent = new hl7V3.ControlActEvent<T>()
  controlActEvent.subject = subject
  sendMessagePayload.ControlActEvent = controlActEvent
  return sendMessagePayload
}

function createUnhandled(interactionId: string) {
  const sendMessagePayload = createSendMessagePayload(interactionId)
  sendMessagePayload.acknowledgement = {
    _attributes: {
      typeCode: "NotATypeCode" as hl7V3.AcknowledgementTypeCode
    }
  }
  return sendMessagePayload
}

function createAcknowledgementDetail(code: string, display: string): hl7V3.AcknowledgementDetail {
  return {
    code: {
      _attributes: {
        codeSystem: "2.16.840.1.113883.2.1.3.2.4.17.32",
        code: code,
        displayName: display
      }
    }
  }
}

function createSendMessagePayloadReason(
  code: string,
  display: string,
  codeSystem: string
): hl7V3.SendMessagePayloadReason {
  return {
    justifyingDetectedIssueEvent: {
      code: {
        _attributes: {
          codeSystem: codeSystem,
          code: code,
          displayName: display
        }
      }
    }
  }
}

function createErrorOperationOutcomeIssue(
  code: fhir.IssueCodes,
  otherCode: string,
  display: string,
  system = "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode"
): fhir.OperationOutcomeIssue {
  return operationOutcomeIssue(code, otherCode, display, system)
}

function createRejectionOperationOutcomeIssue(
  code: fhir.IssueCodes,
  otherCode: string,
  display: string,
  system = "https://fhir.nhs.uk/CodeSystem/EPS-IssueCode"
): fhir.OperationOutcomeIssue {
  return operationOutcomeIssue(code, otherCode, display, system)
}

function operationOutcomeIssue(
  code: fhir.IssueCodes,
  otherCode: string,
  display: string,
  system: string
): fhir.OperationOutcomeIssue{
  return {
    code: code,
    severity: "error",
    details: {
      coding: [{
        system: system,
        code: otherCode,
        display: display
      }]
    }
  }
}

function createReleaseRejectSubject(
  errorCode: hl7V3.PrescriptionReleaseRejectionReason
): hl7V3.PrescriptionReleaseRejectRoot {
  return {
    PrescriptionReleaseReject: {
      pertinentInformation: {
        pertinentRejectionReason:{
          value: errorCode,
          performer: createTestPerformer()
        }
      }
    }
  }
}

function createTestPerformer(): hl7V3.Performer {
  const org = new hl7V3.Organization()
  const orgTelecom = new hl7V3.Telecom()
  orgTelecom._attributes = {use: TelecomUse.WORKPLACE, value: "tel:02380798430"}
  org.id = new hl7V3.SdsOrganizationIdentifier("VNFKT")
  org.name = {_text: "FIVE STAR HOMECARE LEEDS LTD"}
  org.telecom = orgTelecom
  org.addr = {
    _attributes: {use: hl7V3.AddressUse.BUSINESS},
    _text: "",
    streetAddressLine: [
      {_text: "17 Austhorpe Road"},
      {_text: "Crossgates"},
      {_text: "Leeds"},
      {_text: "West Yorkshire"}
    ],
    postalCode: {_text: "LS15 8BA"}
  }

  const agentPerson = new hl7V3.AgentPerson()
  const apTelecom = new hl7V3.Telecom()
  apTelecom._attributes = {value: "tel:02380798431"}
  agentPerson.telecom = [apTelecom]
  agentPerson.representedOrganization = org

  const performer = new hl7V3.Performer()
  performer.AgentPerson = agentPerson

  return performer
}

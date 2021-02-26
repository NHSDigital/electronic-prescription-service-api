import {
  CancelResponseHandler, ReleaseResponseHandler,
  SpineResponseHandler,
  TranslatedSpineResponse
} from "../../../../src/services/translation/response/spine-response-handler"
import pino from "pino"
import * as fhir from "../../../../src/models/fhir"
import * as hl7V3 from "../../../../src/models/hl7-v3"
import * as uuid from "uuid"
import * as moment from "moment"
import {convertMomentToHl7V3DateTime} from "../../../../src/services/translation/common/dateTime"
import {writeXmlStringPretty} from "../../../../src/services/serialisation/xml"
import {spineResponses} from "../../../resources/test-resources"
import {getCancellationResponse} from "../../../services/translation/common/test-helpers"
import {
  getExamplePrescriptionReleaseResponse
} from "../../../services/translation/response/release/release-response.spec"

const logger = pino()

describe("default handler", () => {
  const defaultHandler = new SpineResponseHandler("MCCI_IN010000UK13")

  test("extractSendMessagePayload returns null if spine response doesn't match regex", () => {
    const expectedSendMessagePayload = createSuccess("MCCI_IN010000UK13", undefined)
    const spineResponse = writeXmlStringPretty({MCCI_SOMETHING_ELSE: expectedSendMessagePayload})
    const result = defaultHandler.extractSendMessagePayload(spineResponse)
    expect(result).toBeFalsy()
  })

  test("extractSendMessagePayload returns payload if spine response matches regex", () => {
    const expectedSendMessagePayload = createSuccess("MCCI_IN010000UK13", undefined)
    const spineResponse = writeXmlStringPretty({MCCI_IN010000UK13: expectedSendMessagePayload})
    const actualSendMessagePayload = defaultHandler.extractSendMessagePayload(spineResponse)
    expect(expectedSendMessagePayload).toMatchObject(actualSendMessagePayload)
  })

  test("handleResponse returns null if spine response doesn't match regex", () => {
    const expectedSendMessagePayload = createSuccess("MCCI_IN010000UK13", undefined)
    const spineResponse = writeXmlStringPretty({MCCI_SOMETHING_ELSE: expectedSendMessagePayload})
    const result = defaultHandler.handleResponse(spineResponse, logger)
    expect(result).toBeFalsy()
  })

  test("handleResponse returns 500 response if spine response has invalid acknowledgement type code", () => {
    const expectedSendMessagePayload = createUnhandled("MCCI_IN010000UK13")
    const spineResponse = writeXmlStringPretty({MCCI_IN010000UK13: expectedSendMessagePayload})
    const result = defaultHandler.handleResponse(spineResponse, logger)
    expect(result).toMatchObject<TranslatedSpineResponse>({
      statusCode: 500,
      fhirResponse: {
        resourceType: "OperationOutcome",
        issue: [{
          code: "invalid",
          severity: "error"
        }]
      } as fhir.OperationOutcome
    })
  })

  test("handleResponse returns 500 response if spine response is a rejection and detail is missing", () => {
    const expectedSendMessagePayload = createRejection("MCCI_IN010000UK13")
    const spineResponse = writeXmlStringPretty({MCCI_IN010000UK13: expectedSendMessagePayload})
    const result = defaultHandler.handleResponse(spineResponse, logger)
    expect(result).toMatchObject<TranslatedSpineResponse>({
      statusCode: 500,
      fhirResponse: {
        resourceType: "OperationOutcome",
        issue: [{
          code: "invalid",
          severity: "error"
        }]
      } as fhir.OperationOutcome
    })
  })

  test("handleResponse returns 400 response if spine response is a rejection (single detail)", () => {
    const expectedSendMessagePayload = createRejection(
      "MCCI_IN010000UK13",
      createAcknowledgementDetail("RejectionCode", "Rejection Display Name")
    )
    const spineResponse = writeXmlStringPretty({MCCI_IN010000UK13: expectedSendMessagePayload})
    const result = defaultHandler.handleResponse(spineResponse, logger)
    expect(result).toMatchObject<TranslatedSpineResponse>({
      statusCode: 400,
      fhirResponse: {
        resourceType: "OperationOutcome",
        issue: [createErrorOperationOutcomeIssue("RejectionCode", "Rejection Display Name")]
      } as fhir.OperationOutcome
    })
  })

  test("handleResponse returns 400 response if spine response is a rejection (multiple details)", () => {
    const expectedSendMessagePayload = createRejection(
      "MCCI_IN010000UK13",
      createAcknowledgementDetail("RejectionCode1", "Rejection Display Name 1"),
      createAcknowledgementDetail("RejectionCode2", "Rejection Display Name 2")
    )
    const spineResponse = writeXmlStringPretty({MCCI_IN010000UK13: expectedSendMessagePayload})
    const result = defaultHandler.handleResponse(spineResponse, logger)
    expect(result).toMatchObject<TranslatedSpineResponse>({
      statusCode: 400,
      fhirResponse: {
        resourceType: "OperationOutcome",
        issue: [
          createErrorOperationOutcomeIssue("RejectionCode1", "Rejection Display Name 1"),
          createErrorOperationOutcomeIssue("RejectionCode2", "Rejection Display Name 2")
        ]
      } as fhir.OperationOutcome
    })
  })

  test("handleResponse returns 500 response if spine response is an error and reason is missing", () => {
    const expectedSendMessagePayload = createError("MCCI_IN010000UK13", undefined)
    const spineResponse = writeXmlStringPretty({MCCI_IN010000UK13: expectedSendMessagePayload})
    const result = defaultHandler.handleResponse(spineResponse, logger)
    expect(result).toMatchObject<TranslatedSpineResponse>({
      statusCode: 500,
      fhirResponse: {
        resourceType: "OperationOutcome",
        issue: [{
          code: "invalid",
          severity: "error"
        }]
      } as fhir.OperationOutcome
    })
  })

  test("handleResponse returns 400 response if spine response is an error (single reason)", () => {
    const expectedSendMessagePayload = createError(
      "MCCI_IN010000UK13",
      undefined,
      createSendMessagePayloadReason("ErrorCode", "Error Display Name")
    )
    const spineResponse = writeXmlStringPretty({MCCI_IN010000UK13: expectedSendMessagePayload})
    const result = defaultHandler.handleResponse(spineResponse, logger)
    expect(result).toMatchObject<TranslatedSpineResponse>({
      statusCode: 400,
      fhirResponse: {
        resourceType: "OperationOutcome",
        issue: [createErrorOperationOutcomeIssue("ErrorCode", "Error Display Name")]
      } as fhir.OperationOutcome
    })
  })

  test("handleResponse returns 400 response if spine response is an error (multiple reasons)", () => {
    const expectedSendMessagePayload = createError(
      "MCCI_IN010000UK13",
      undefined,
      createSendMessagePayloadReason("ErrorCode1", "Error Display Name 1"),
      createSendMessagePayloadReason("ErrorCode2", "Error Display Name 2")
    )
    const spineResponse = writeXmlStringPretty({MCCI_IN010000UK13: expectedSendMessagePayload})
    const result = defaultHandler.handleResponse(spineResponse, logger)
    expect(result).toMatchObject<TranslatedSpineResponse>({
      statusCode: 400,
      fhirResponse: {
        resourceType: "OperationOutcome",
        issue: [
          createErrorOperationOutcomeIssue("ErrorCode1", "Error Display Name 1"),
          createErrorOperationOutcomeIssue("ErrorCode2", "Error Display Name 2")
        ]
      } as fhir.OperationOutcome
    })
  })

  test("handleResponse returns 200 response if spine response is a success", () => {
    const expectedSendMessagePayload = createSuccess("MCCI_IN010000UK13", undefined)
    const spineResponse = writeXmlStringPretty({MCCI_IN010000UK13: expectedSendMessagePayload})
    const result = defaultHandler.handleResponse(spineResponse, logger)
    expect(result).toMatchObject<TranslatedSpineResponse>({
      statusCode: 200,
      fhirResponse: {
        resourceType: "OperationOutcome",
        issue: [{
          code: "informational",
          severity: "information"
        }]
      } as fhir.OperationOutcome
    })
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

  test("handleResponse calls rejection override if spine response is a rejection", () => {
    const expectedSendMessagePayload = createRejection(
      "MCCI_IN010000UK13",
      createAcknowledgementDetail("RejectionCode", "Rejection Display Name")
    )
    const spineResponse = writeXmlStringPretty({MCCI_IN010000UK13: expectedSendMessagePayload})
    rejectionOverride.mockReturnValueOnce(customResponse)
    const result = customHandler.handleResponse(spineResponse, logger)
    expect(result).toBe(customResponse)
    expect(rejectionOverride).toHaveBeenCalled()
  })

  test("handleResponse calls error override if spine response is an error", () => {
    const expectedSendMessagePayload = createError(
      "MCCI_IN010000UK13",
      undefined,
      createSendMessagePayloadReason("ErrorCode", "Error Display Name")
    )
    const spineResponse = writeXmlStringPretty({MCCI_IN010000UK13: expectedSendMessagePayload})
    errorOverride.mockReturnValueOnce(customResponse)
    const result = customHandler.handleResponse(spineResponse, logger)
    expect(result).toBe(customResponse)
    expect(errorOverride).toHaveBeenCalled()
  })

  test("handleResponse calls success override if spine response is a success", () => {
    const expectedSendMessagePayload = createSuccess("MCCI_IN010000UK13", undefined)
    const spineResponse = writeXmlStringPretty({MCCI_IN010000UK13: expectedSendMessagePayload})
    successOverride.mockReturnValueOnce(customResponse)
    const result = customHandler.handleResponse(spineResponse, logger)
    expect(result).toBe(customResponse)
    expect(successOverride).toHaveBeenCalled()
  })
})

describe("cancel response handler", () => {
  const cancelResponseHandler = new CancelResponseHandler("PORX_IN050101UK31")
  const cancellationResponseRoot: hl7V3.CancellationResponseRoot = {
    CancellationResponse: getCancellationResponse(spineResponses.cancellationSuccess)
  }

  test("handleResponse returns 400 response if spine response is a rejection", () => {
    const expectedSendMessagePayload = createRejection(
      "PORX_IN050101UK31",
      createAcknowledgementDetail("RejectionCode", "Rejection Display Name")
    )
    const spineResponse = writeXmlStringPretty({PORX_IN050101UK31: expectedSendMessagePayload})
    const result = cancelResponseHandler.handleResponse(spineResponse, logger)
    expect(result).toMatchObject<TranslatedSpineResponse>({
      statusCode: 400,
      fhirResponse: {
        resourceType: "OperationOutcome",
        issue: [createErrorOperationOutcomeIssue("RejectionCode", "Rejection Display Name")]
      } as fhir.OperationOutcome
    })
  })

  test("handleResponse returns 400 response if spine response is an error", () => {
    const expectedSendMessagePayload = createError(
      "PORX_IN050101UK31",
      cancellationResponseRoot,
      createSendMessagePayloadReason("ErrorCode", "Error Display Name")
    )
    const spineResponse = writeXmlStringPretty({PORX_IN050101UK31: expectedSendMessagePayload})
    const result = cancelResponseHandler.handleResponse(spineResponse, logger)
    expect(result).toMatchObject<TranslatedSpineResponse>({
      statusCode: 400,
      fhirResponse: {
        resourceType: "Bundle"
      } as fhir.Bundle
    })
  })

  test("handleResponse returns 200 response if spine response is a success", () => {
    const expectedSendMessagePayload = createSuccess(
      "PORX_IN050101UK31",
      cancellationResponseRoot
    )
    const spineResponse = writeXmlStringPretty({PORX_IN050101UK31: expectedSendMessagePayload})
    const result = cancelResponseHandler.handleResponse(spineResponse, logger)
    expect(result).toMatchObject<TranslatedSpineResponse>({
      statusCode: 200,
      fhirResponse: {
        resourceType: "Bundle"
      } as fhir.Bundle
    })
  })
})

describe("release response handler", () => {
  const releaseResponseHandler = new ReleaseResponseHandler("PORX_IN070101UK31")
  const releaseResponseRoot: hl7V3.PrescriptionReleaseResponseRoot = {
    PrescriptionReleaseResponse: getExamplePrescriptionReleaseResponse()
  }

  test("handleResponse returns 400 response if spine response is a rejection", () => {
    const expectedSendMessagePayload = createRejection(
      "PORX_IN070101UK31",
      createAcknowledgementDetail("RejectionCode", "Rejection Display Name")
    )
    const spineResponse = writeXmlStringPretty({PORX_IN070101UK31: expectedSendMessagePayload})
    const result = releaseResponseHandler.handleResponse(spineResponse, logger)
    expect(result).toMatchObject<TranslatedSpineResponse>({
      statusCode: 400,
      fhirResponse: {
        resourceType: "OperationOutcome",
        issue: [createErrorOperationOutcomeIssue("RejectionCode", "Rejection Display Name")]
      } as fhir.OperationOutcome
    })
  })

  test("handleResponse returns 400 response if spine response is an error", () => {
    const expectedSendMessagePayload = createError(
      "PORX_IN070101UK31",
      releaseResponseRoot,
      createSendMessagePayloadReason("ErrorCode", "Error Display Name")
    )
    const spineResponse = writeXmlStringPretty({PORX_IN070101UK31: expectedSendMessagePayload})
    const result = releaseResponseHandler.handleResponse(spineResponse, logger)
    expect(result).toMatchObject<TranslatedSpineResponse>({
      statusCode: 400,
      fhirResponse: {
        resourceType: "OperationOutcome",
        issue: [createErrorOperationOutcomeIssue("ErrorCode", "Error Display Name")]
      } as fhir.OperationOutcome
    })
  })

  test("handleResponse returns 200 response if spine response is a success", () => {
    const expectedSendMessagePayload = createSuccess(
      "PORX_IN070101UK31",
      releaseResponseRoot
    )
    const spineResponse = writeXmlStringPretty({PORX_IN070101UK31: expectedSendMessagePayload})
    const result = releaseResponseHandler.handleResponse(spineResponse, logger)
    expect(result).toMatchObject<TranslatedSpineResponse>({
      statusCode: 200,
      fhirResponse: {
        resourceType: "Bundle"
      } as fhir.Bundle
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

function createSendMessagePayloadReason(code: string, display: string): hl7V3.SendMessagePayloadReason {
  return {
    justifyingDetectedIssueEvent: {
      code: {
        _attributes: {
          codeSystem: "ErrorCodeSystem",
          code: code,
          displayName: display
        }
      }
    }
  }
}

function createErrorOperationOutcomeIssue(code: string, display: string): fhir.OperationOutcomeIssue {
  return {
    code: "invalid",
    severity: "error",
    details: {
      coding: [{
        system: "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode",
        code: code,
        display: display
      }]
    }
  }
}

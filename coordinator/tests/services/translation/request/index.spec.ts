import * as translator from "../../../../src/services/translation/request"
import {convertFhirMessageToSignedInfoMessage} from "../../../../src/services/translation/request"
import * as TestResources from "../../../resources/test-resources"
import * as LosslessJson from "lossless-json"
import {getStringParameterByName, isTruthy} from "../../../../src/services/translation/common"
import {MomentFormatSpecification, MomentInput} from "moment"
import {xmlTest} from "../../../resources/test-helpers"
import {ElementCompact} from "xml-js"
import {convertHL7V3DateTimeToIsoDateTimeString} from "../../../../src/services/translation/common/dateTime"
import {fhir, processingErrors as errors} from "@models"
import pino from "pino"

const logger = pino()

const actualMoment = jest.requireActual("moment")
const mockTime = {value: "2020-12-18T12:34:34Z"}
jest.mock("moment", () => ({
  utc: (input?: MomentInput, format?: MomentFormatSpecification) => actualMoment.utc(input || mockTime.value, format)
}))

describe("convertFhirMessageToSignedInfoMessage", () => {
  const cases = TestResources.specification.map(example => [
    example.description,
    example.fhirMessageUnsigned,
    example.fhirMessageDigest
  ])

  test.each(cases)("accepts %s", (desc: string, message: fhir.Bundle) => {
    expect(() => convertFhirMessageToSignedInfoMessage(message, logger)).not.toThrow()
  })

  test("rejects a cancellation message", () => {
    const cancellationMessage = TestResources.specification.map(s => s.fhirMessageCancel).filter(isTruthy)[0]
    expect(() => convertFhirMessageToSignedInfoMessage(cancellationMessage, logger)).toThrow(errors.InvalidValueError)
  })

  test.each(cases)(
    "produces expected result for %s",
    (desc: string, message: fhir.Bundle, expectedParameters: fhir.Parameters) => {
      mockTime.value = getStringParameterByName(expectedParameters.parameter, "timestamp").valueString
      const actualParameters = convertFhirMessageToSignedInfoMessage(message, logger)
      expect(actualParameters).toEqual(expectedParameters)
    }
  )
})

describe("convertFhirMessageToHl7V3ParentPrescriptionMessage", () => {
  const cases = TestResources.specification.map(example => [
    example.description,
    example.fhirMessageSigned,
    example.hl7V3Message
  ])

  const headers = {
    "nhsd-request-id": "test",
    "nhsd-asid": "200000001285",
    "nhsd-party-key": "T141D-822234",
    "nhsd-identity-uuid": "555254239107",
    "nhsd-session-urid": "555254240100"
  }

  test.each(cases)("accepts %s", (desc: string, message: fhir.Bundle) => {
    expect(async() => await translator.convertBundleToSpineRequest(message, headers, logger)).not.toThrow()
  })

  test.each(cases)(
    "produces expected result for %s",
    (desc: string, message: fhir.Bundle, expectedOutput: ElementCompact) => {
      mockTime.value = convertHL7V3DateTimeToIsoDateTimeString(expectedOutput.PORX_IN020101SM31.creationTime)
      const actualMessage = translator.createParentPrescriptionSendMessagePayload(message, headers, logger)
      xmlTest(actualMessage, expectedOutput.PORX_IN020101SM31)()
    }
  )

  test("produces result with no lower case UUIDs", async() => {
    const messageWithLowercaseUUIDs = getMessageWithLowercaseUUIDs()

    const translatedMessage = (
      await translator.convertBundleToSpineRequest(messageWithLowercaseUUIDs, headers, logger)
    ).message

    const allNonUpperCaseUUIDS = getAllUUIDsNotUpperCase(translatedMessage)
    expect(allNonUpperCaseUUIDS.length).toBe(0)
  })
})

function getMessageWithLowercaseUUIDs() {
  const re = /[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}/g
  let messageStr = LosslessJson.stringify(TestResources.examplePrescription1.fhirMessageUnsigned)
  messageStr = messageStr.replace(re, (uuid) => uuid.toLowerCase())
  return LosslessJson.parse(messageStr)
}

function getAllUUIDsNotUpperCase(translatedMessage: string) {
  const caseInsensitiveRe = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi
  const allUUIDS = translatedMessage.match(caseInsensitiveRe)
  const uppercaseUUIDRe = /[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}/g
  const allUpperUUIDS = translatedMessage.match(uppercaseUUIDRe)
  return allUUIDS.filter(uuid => !allUpperUUIDS.includes(uuid))
}

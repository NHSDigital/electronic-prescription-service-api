import * as translator from "../../../src/services/translation"
import {convertFhirMessageToSignedInfoMessage} from "../../../src/services/translation"
import * as TestResources from "../../resources/test-resources"
import * as LosslessJson from "lossless-json"
import {Bundle, Parameters} from "../../../src/models/fhir/fhir-resources"
import {InvalidValueError} from "../../../src/models/errors/processing-errors"
import {convertHL7V3DateTimeToIsoDateTimeString, isTruthy} from "../../../src/services/translation/common"
import {MomentFormatSpecification, MomentInput} from "moment"
import {xmlTest} from "../../resources/test-helpers"
import {ElementCompact} from "xml-js"

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

  test.each(cases)("accepts %s", (desc: string, message: Bundle) => {
    expect(() => convertFhirMessageToSignedInfoMessage(message)).not.toThrow()
  })

  test("rejects a cancellation message", () => {
    const cancellationMessage = TestResources.specification.map(s => s.fhirMessageCancel).filter(isTruthy)[0]
    expect(() => convertFhirMessageToSignedInfoMessage(cancellationMessage)).toThrow(InvalidValueError)
  })

  test.each(cases)(
    "produces expected result for %s",
    (desc: string, message: Bundle, expectedParameters: Parameters) => {
      mockTime.value = expectedParameters.parameter.find(p => p.name === "timestamp").valueString
      const actualParameters = convertFhirMessageToSignedInfoMessage(message)
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

  test.each(cases)("accepts %s", (desc: string, message: Bundle) => {
    expect(() => translator.convertFhirMessageToSpineRequest(message)).not.toThrow()
  })

  test.each(cases)(
    "produces expected result for %s",
    (desc: string, message: Bundle, expectedOutput: ElementCompact) => {
      mockTime.value = convertHL7V3DateTimeToIsoDateTimeString(expectedOutput.PORX_IN020101SM31.creationTime)
      const actualMessage = translator.createParentPrescriptionSendMessagePayload(message)
      xmlTest(actualMessage, expectedOutput.PORX_IN020101SM31)()
    }
  )

  test("produces result with no lower case UUIDs", () => {
    const messageWithLowercaseUUIDs = getMessageWithLowercaseUUIDs()

    const translatedMessage = translator.convertFhirMessageToSpineRequest(messageWithLowercaseUUIDs).message

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

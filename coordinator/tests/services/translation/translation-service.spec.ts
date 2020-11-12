import * as translator from "../../../src/services/translation"
import * as TestResources from "../../resources/test-resources"
import * as LosslessJson from "lossless-json"
import {Bundle} from "../../../src/models/fhir/fhir-resources"
import {convertFhirMessageToSignedInfoMessage} from "../../../src/services/translation"

describe("convertFhirMessageToSignedInfoMessage", () => {
  const cases = TestResources.specification.map(example => [
    example.description,
    example.fhirMessageUnsigned,
    example.fhirMessageDigest
  ])

  test.each(cases)("accepts %s", (desc: string, message: Bundle) => {
    expect(() => convertFhirMessageToSignedInfoMessage(message)).not.toThrow()
  })
})

describe("convertFhirMessageToHl7V3ParentPrescriptionMessage", () => {
  const cases = TestResources.specification.map(example => [
    example.description,
    example.fhirMessageSigned,
    example.hl7V3Message])

  test.each(cases)("accepts %s", (desc: string, message: Bundle) => {
    expect(() => translator.convertFhirMessageToSpineRequest(message)).not.toThrow()
  })

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

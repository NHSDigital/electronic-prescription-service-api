import * as translator from "../../../src/services/translation/translation-service"
import {convertFhirMessageToSignedInfoMessage} from "../../../src/services/translation/translation-service"
import * as TestResources from "../../resources/test-resources"
import * as XmlJs from "xml-js"
import {MomentFormatSpecification, MomentInput} from "moment"
import {xmlTest} from "../../resources/test-helpers"
import * as LosslessJson from "lossless-json"
import {Bundle, Parameters} from "../../../src/model/fhir-resources"
import {ElementCompact} from "xml-js"
import {Hl7InteractionIdentifier} from "../../../src/model/hl7-v3-datatypes-codes"

jest.mock("uuid", () => {
  return {
    v4: () => {
      return "A7B86F8D-1DBD-FC28-E050-D20AE3A215F0"
    }
  }
})

jest.mock("moment", () => {
  return {
    ...jest.requireActual("moment"),
    utc: (input?: MomentInput, format?: MomentFormatSpecification) => jest.requireActual("moment").utc(input ? input : "2020-06-10T10:26:31.000Z", format)
  }
})

describe("convertFhirMessageToSignedInfoMessage", () => {
  const cases = TestResources.all.map(example => [example.description, example.fhirMessageUnsigned, example.fhirMessageDigest])

  test.each(cases)("accepts %s", (desc: string, message: Bundle) => {
    expect(() => convertFhirMessageToSignedInfoMessage(message)).not.toThrow()
  })

  test.each(cases)("returns correct value for %s", (desc: string, input: Bundle, output: Parameters) => {
    const actualOutput = convertFhirMessageToSignedInfoMessage(input)
    const expectedOutput = JSON.stringify(output, null, 2)
    expect(actualOutput).toEqual(expectedOutput)
  })
})

describe("convertFhirMessageToHl7V3ParentPrescriptionMessage", () => {
  const cases = TestResources.all.map(example => [example.description, example.fhirMessageSigned, example.hl7V3Message])

  test.each(cases)("accepts %s", (desc: string, message: Bundle) => {
    expect(() => translator.convertFhirMessageToSpineRequest(message)).not.toThrow()
  })

  test.each(cases)("returns correct value for %s", (desc: string, input: Bundle, output: ElementCompact) => {
    const spineRequest = translator.convertFhirMessageToSpineRequest(input)
    xmlTest(XmlJs.xml2js(spineRequest.message, {compact: true}), output)()
    expect(spineRequest.interactionId).toEqual(Hl7InteractionIdentifier.PARENT_PRESCRIPTION_URGENT._attributes.extension)
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

import * as translator from "../../../src/services/translation/translation-service"
import {convertFhirMessageToSignedInfoMessage} from "../../../src/services/translation/translation-service"
import * as TestResources from "../../resources/test-resources"
import * as XmlJs from "xml-js"
import {MomentFormatSpecification, MomentInput} from "moment"
import {xmlTest} from "../../resources/test-helpers"
import * as LosslessJson from "lossless-json"

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

test("convertFhirMessageToHl7V3SignedInfo returns correct value", () => {
  const actualOutput = convertFhirMessageToSignedInfoMessage(TestResources.examplePrescription1.fhirMessageUnsigned)
  const expectedOutput = JSON.stringify(TestResources.examplePrescription1.fhirMessageDigest, null, 2)
  expect(actualOutput).toEqual(expectedOutput)
})

test(
  "convertFhirMessageToHl7V3ParentPrescription returns correct value",
  xmlTest(
    XmlJs.xml2js(translator.convertFhirMessageToHl7V3ParentPrescriptionMessage(TestResources.examplePrescription1.fhirMessageSigned), {compact: true}),
    TestResources.examplePrescription1.hl7V3Message
  )
)

test("convertFhirMessageToHl7V3ParentPrescriptionMessage result has no lower case UUIDs", () => {
  const messageWithLowercaseUUIDs = getMessageWithLowercaseUUIDs()

  const translatedMessage = translator.convertFhirMessageToHl7V3ParentPrescriptionMessage(messageWithLowercaseUUIDs)

  const allNonUpperCaseUUIDS = getAllUUIDsNotUpperCase(translatedMessage)
  expect(allNonUpperCaseUUIDS.length).toBe(0)
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

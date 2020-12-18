import {convertParentPrescription} from "../../../src/services/translation/prescription/parent-prescription"
import {
  convertFragmentsToHashableFormat,
  extractFragments
} from "../../../src/services/translation/prescription/signature"
import * as TestResources from "../../resources/test-resources"
import * as XmlJs from "xml-js"
import {xmlTest} from "../../resources/test-helpers"
import {Fragments} from "../../../src/models/signature"
import {ParentPrescription} from "../../../src/models/hl7-v3/hl7-v3-prescriptions"

let hl7V3ParentPrescription: ParentPrescription
let fragments: Fragments

beforeAll(() => {
  hl7V3ParentPrescription = convertParentPrescription(TestResources.examplePrescription1.fhirMessageUnsigned)
  fragments = extractFragments(hl7V3ParentPrescription)
})

test("convertFragmentsToHashableFormat returns correct value", () => {
  const output = convertFragmentsToHashableFormat(fragments)
  const outputWithFixedTime = output.replace(
    /<time xmlns="urn:hl7-org:v3" value="\d{14}">/,
    '<time xmlns="urn:hl7-org:v3" value="20201218123434">'
  )
  xmlTest(
    XmlJs.xml2js(outputWithFixedTime, {compact: true}),
    TestResources.examplePrescription1.hl7V3SignatureFragments
  )()
})

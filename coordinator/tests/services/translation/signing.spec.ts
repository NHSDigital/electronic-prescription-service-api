import {convertParentPrescription} from "../../../src/services/translation/parent-prescription"
import {extractFragments,convertFragmentsToHashableFormat,convertFragmentsToDisplayableFormat} from "../../../src/services/translation/signing"
import * as TestResources from "../../resources/test-resources"
import * as XmlJs from "xml-js"
import {xmlTest} from "../../resources/test-helpers"
import {Fragments} from "../../../src/model/signing"
import {ParentPrescription} from "../../../src/model/hl7-v3-prescriptions"

let hl7V3ParentPrescription: ParentPrescription
let fragments: Fragments

beforeAll(() => {
  hl7V3ParentPrescription = convertParentPrescription(TestResources.examplePrescription1.fhirMessageUnsigned)
  fragments = extractFragments(hl7V3ParentPrescription)
})

test(
  "convertFragmentsToHashableFormat returns correct value", () => {
    xmlTest(
      XmlJs.xml2js(convertFragmentsToHashableFormat(fragments)),
      TestResources.examplePrescription1.hl7V3SignatureFragments
    )
  })

test(
  "convertFragmentsToDisplayableFormat returns correct patient details", () => {
    const display = convertFragmentsToDisplayableFormat(fragments)
    expect(display.patientName).toEqual("MR HEADLEY TED PENSON")
  })

test(
  "convertFragmentsToDisplayableFormat returns correct prescriber details", () => {
    const display = convertFragmentsToDisplayableFormat(fragments)
    expect(display.prescriberName).toEqual("ANDREW CHANDLER")
  })

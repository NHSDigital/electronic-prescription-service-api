import {convertParentPrescription} from "../../../../src/services/translation/request/prescribe/parent-prescription"
import {
  convertFragmentsToHashableFormat,
  extractFragments
} from "../../../../src/services/translation/request/signature"
import * as TestResources from "../../../resources/test-resources"
import * as XmlJs from "xml-js"
import {xmlTest} from "../../../resources/test-helpers"
import {hl7V3, fhir, signature} from "@models"
import requireActual = jest.requireActual
import {MomentFormatSpecification, MomentInput} from "moment"
import {getMedicationRequests} from "../../../../src/services/translation/common/getResourcesOfType"
import {getExtensionForUrl} from "../../../../src/services/translation/common"
import pino from "pino"

const logger = pino()

const actualMoment = requireActual("moment")
jest.mock("moment", () => ({
  utc: (input?: MomentInput, format?: MomentFormatSpecification) =>
    actualMoment.utc(input || "2020-12-18T12:34:34Z", format)
}))

let hl7V3ParentPrescription: hl7V3.ParentPrescription
let hl7V3ExtractedFragments: signature.Fragments
let fragments: XmlJs.ElementCompact
let prescriptionId: string

beforeAll(() => {
  const bundle = TestResources.specification[0].fhirMessageUnsigned

  hl7V3ParentPrescription = convertParentPrescription(bundle, logger)
  hl7V3ExtractedFragments = extractFragments(hl7V3ParentPrescription)
  fragments = TestResources.specification[0].hl7V3SignatureFragments

  syncPrescriptionIdsFromExample(bundle)
})

test("convertFragmentsToHashableFormat returns correct value", () => {
  const output = convertFragmentsToHashableFormat(hl7V3ExtractedFragments)
  xmlTest(XmlJs.xml2js(output, {compact: true}), fragments)()
})

function syncPrescriptionIdsFromExample(bundle: fhir.Bundle) {
  const firstMedicationRequest = getMedicationRequests(bundle)[0]
  const groupIdentifier = firstMedicationRequest.groupIdentifier
  const prescriptionIdExtension = getExtensionForUrl(
    groupIdentifier.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionId",
    "MedicationRequest.groupIdentifier.extension"
  ) as fhir.IdentifierExtension
  prescriptionId = prescriptionIdExtension.valueIdentifier.value
  hl7V3ExtractedFragments.id._attributes.root = prescriptionId
  fragments.FragmentsToBeHashed.Fragment[0].id._attributes.root = prescriptionId
}

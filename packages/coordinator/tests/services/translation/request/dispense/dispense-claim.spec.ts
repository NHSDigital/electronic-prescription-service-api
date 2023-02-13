import * as TestResources from "../../../../resources/test-resources"
import {MomentFormatSpecification, MomentInput} from "moment"
import {fhir, hl7V3} from "@models"
import {toArray} from "../../../../../src/services/translation/common"
import {clone} from "../../../../resources/test-helpers"
import {convertDispenseClaim} from "../../../../../src/services/translation/request/dispense/dispense-claim"
import * as testData from "../../../../resources/test-data"
import requireActual = jest.requireActual
import {getClaimFromTestFile} from "../../../../resources/test-resources"

const actualMoment = requireActual("moment")
jest.mock("moment", () => ({
  utc: (input?: MomentInput, format?: MomentFormatSpecification) =>
    actualMoment.utc(input || "2020-12-18T12:34:34Z", format)
}))

const mockCreateLegalAuthenticator = jest.fn()
jest.mock("../../../../../src/services/translation/request/agent-person", () => ({
  createLegalAuthenticator: (pr: fhir.PractitionerRole, org: fhir.Organization, ts: hl7V3.Timestamp) =>
    mockCreateLegalAuthenticator(pr, org, ts)
}))

describe("convertDispenseClaim", () => {
  const cases = toArray(TestResources.examplePrescription3)
    .map((example: TestResources.ExamplePrescription) => [
      example.description,
      example.fhirMessageClaim
    ])

  test.each(cases)("accepts %s", (desc: string, input: fhir.Claim) => {
    expect(() => convertDispenseClaim(input)).not.toThrow()
  })

  test("FHIR replacementOf gets populated in v3", () => {
    const claim: fhir.Claim = clone(TestResources.examplePrescription3.fhirMessageClaim)
    claim.extension = [{
      url: "https://fhir.nhs.uk/StructureDefinition/Extension-replacementOf",
      valueIdentifier: {
        system: "",
        value: "bluh id"
      }
    }]
    const v3Claim = convertDispenseClaim(claim)
    expect(v3Claim.replacementOf).toBeDefined()
  })

  test("FHIR replacementOf doesn't get populated in v3", () => {
    const claim: fhir.Claim = clone(TestResources.examplePrescription3.fhirMessageClaim)
    const v3Claim = convertDispenseClaim(claim)
    expect(v3Claim.replacementOf).toBeUndefined()
  })

  test("No chargeExemptionCoding results in no v3.coverage", () => {
    const claim: fhir.Claim = clone(TestResources.examplePrescription3.fhirMessageClaim)
    claim.item[0].programCode = []
    const v3Claim = convertDispenseClaim(claim)
    expect(v3Claim.coverage).toBeUndefined()
  })

  test("chargeExemptionCoding with no evidence results in v3.coverage without authorization", () => {
    const claim: fhir.Claim = clone(TestResources.examplePrescription3.fhirMessageClaim)
    claim.item[0].programCode = [{
      coding: [
        {
          system: "https://fhir.nhs.uk/CodeSystem/prescription-charge-exemption",
          code: "0001",
          display: "Patient has paid appropriate charges"
        }
      ]
    }]
    const v3Claim = convertDispenseClaim(claim)
    expect(v3Claim.coverage).toBeDefined()
    expect(v3Claim.coverage.coveringChargeExempt.authorization).toBeUndefined()
  })

  test("chargeExemptionCoding with evidence results in v3.coverage with authorization", () => {
    const claim: fhir.Claim = clone(TestResources.examplePrescription3.fhirMessageClaim)
    claim.item[0].programCode = [{
      coding: [
        {
          system: "https://fhir.nhs.uk/CodeSystem/prescription-charge-exemption",
          code: "0002",
          display: "is under 16 years of age"
        },
        {
          system: "https://fhir.nhs.uk/CodeSystem/DM-exemption-evidence",
          code: "evidence-seen",
          display: "Evidence Seen"
        }
      ]
    }]
    const v3Claim = convertDispenseClaim(claim)
    expect(v3Claim.coverage).toBeDefined()
    expect(v3Claim.coverage.coveringChargeExempt.authorization).toBeDefined()
  })

  test("legalAuthenticator comes from PractitionerRole and Organization", () => {
    const mockLegalAuthenticator = new hl7V3.PrescriptionLegalAuthenticator()
    mockCreateLegalAuthenticator.mockReturnValue(mockLegalAuthenticator)

    const claim: fhir.Claim = clone(TestResources.examplePrescription3.fhirMessageClaim)

    const testPractitionerRole = testData.practitionerRole
    testPractitionerRole.organization = {
      reference: `#${testData.organization.id}`
    }

    claim.contained = [testPractitionerRole, testData.organization]
    claim.provider = {
      reference: testData.practitionerRole.id
    }

    const v3Claim = convertDispenseClaim(claim)
    expect(mockCreateLegalAuthenticator)
      .toHaveBeenCalledWith(testPractitionerRole, testData.organization, "2021-09-23T13:09:56+00:00")
    expect(v3Claim.pertinentInformation1.pertinentSupplyHeader.legalAuthenticator).toBe(mockLegalAuthenticator)
  })
})


describe("convertDispenseClaim for repeat ERD", () => {
  const claim: fhir.Claim = getClaimFromTestFile("../../tests/resources/test-data/fhir/dispensing/Claim-Request-Repeat.json")
  const result = convertDispenseClaim(claim)
  const supplyHeaderRepeatNumber = result.pertinentInformation1.pertinentSupplyHeader.repeatNumber
  const supplyLineItemRepeatNumber = result.pertinentInformation1.pertinentSupplyHeader.pertinentInformation1[0].pertinentSuppliedLineItem.repeatNumber
  test('should convert numberofRepeatsIssued to pertinentSupplyHeader.repeatNumber.low', () => { 
    expect(supplyHeaderRepeatNumber.low._attributes.value).toEqual("3")
  })
  test('should convert numberofRepeatsAllowed to pertinentSupplyHeader.repeatNumber.high', () => { 
    expect(supplyHeaderRepeatNumber.high._attributes.value).toEqual("6")
  })

  test('should convert numberofRepeatsIssued to pertinentSupplyLineitem.repeatNumber.low', () => { 
    expect(supplyLineItemRepeatNumber.low._attributes.value).toEqual("4")
  })
  test('should convert numberofRepeatsAllowed to pertinentSupplyLineitem.repeatNumber.high', () => { 
    expect(supplyLineItemRepeatNumber.high._attributes.value).toEqual("7")
  })
})

describe("createSuppliedLineItem", () => {
  test("FHIR with no statusReasonExtension should not populate suppliedLineItem.pertinentInformation2", () => {
    const claim: fhir.Claim = clone(TestResources.examplePrescription3.fhirMessageClaim)
    claim.item[0].detail.forEach(detail => {
      detail.extension = [
        {
          url: "https://fhir.nhs.uk/StructureDefinition/Extension-ClaimSequenceIdentifier",
          valueIdentifier: {
            system: "https://fhir.nhs.uk/Id/claim-sequence-identifier",
            value: "a54219b8-f741-4c47-b662-e4f8dfa49ab6"
          }
        },
        {
          url: "https://fhir.nhs.uk/StructureDefinition/Extension-ClaimMedicationRequestReference",
          valueReference: {
            identifier: {
              system: "https://fhir.nhs.uk/Id/prescription-order-item-number",
              value: "ea66ee9d-a981-432f-8c27-6907cbd99219"
            }
          }
        }
      ]
    })
    const v3Claim = convertDispenseClaim(claim)
    v3Claim.pertinentInformation1.pertinentSupplyHeader.pertinentInformation1.forEach(pertinentInformation1 => {
      expect(pertinentInformation1.pertinentSuppliedLineItem.pertinentInformation2).toBeUndefined()
    })
  })

  test("FHIR statusReasonExtension should populate suppliedLineItem.pertinentInformation2", () => {
    const claim: fhir.Claim = clone(TestResources.examplePrescription3.fhirMessageClaim)
    claim.item[0].detail.forEach(detail => {
      detail.extension = [
        {
          url: "https://fhir.nhs.uk/StructureDefinition/Extension-ClaimSequenceIdentifier",
          valueIdentifier: {
            system: "https://fhir.nhs.uk/Id/claim-sequence-identifier",
            value: "a54219b8-f741-4c47-b662-e4f8dfa49ab6"
          }
        },
        {
          url: "https://fhir.nhs.uk/StructureDefinition/Extension-ClaimMedicationRequestReference",
          valueReference: {
            identifier: {
              system: "https://fhir.nhs.uk/Id/prescription-order-item-number",
              value: "ea66ee9d-a981-432f-8c27-6907cbd99219"
            }
          }
        },
        {
          url: "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-TaskBusinessStatusReason",
          valueCoding: {
            system: "",
            code: "bluh code"
          }
        }
      ]
    })

    const v3Claim = convertDispenseClaim(claim)
    v3Claim.pertinentInformation1.pertinentSupplyHeader.pertinentInformation1.forEach(pertinentInformation1 => {
      expect(pertinentInformation1.pertinentSuppliedLineItem.pertinentInformation2).toBeDefined()
    })
  })

  test("FHIR with no subDetail should not populate suppliedLineItem.component", () => {
    const claim: fhir.Claim = clone(TestResources.examplePrescription3.fhirMessageClaim)
    claim.item[0].detail.forEach(detail => delete detail.subDetail)
    const v3Claim = convertDispenseClaim(claim)
    v3Claim.pertinentInformation1.pertinentSupplyHeader.pertinentInformation1.forEach(pertinentInformation1 => {
      expect(pertinentInformation1.pertinentSuppliedLineItem.component).toBeUndefined()
    })
  })
})

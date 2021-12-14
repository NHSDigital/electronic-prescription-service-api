import * as TestResources from "../../../../resources/test-resources"
import requireActual = jest.requireActual
import {MomentFormatSpecification, MomentInput} from "moment"
import {fhir} from "@models"
import {toArray} from "../../../../../src/services/translation/common"
import {clone} from "../../../../resources/test-helpers"
import pino = require("pino")
import {convertDispenseClaim} from "../../../../../src/services/translation/request/dispense/dispense-claim"

const logger = pino()

const actualMoment = requireActual("moment")
jest.mock("moment", () => ({
  utc: (input?: MomentInput, format?: MomentFormatSpecification) =>
    actualMoment.utc(input || "2020-12-18T12:34:34Z", format)
}))
jest.mock("../../../../../src/services/translation/request/agent-unattended", () => ({
  createAgentPersonFromAuthenticatedUserDetails: jest.fn()
}))

describe("convertDispenseClaim", () => {
  const cases = toArray(TestResources.examplePrescription3)
    .map((example: TestResources.ExamplePrescription) => [
      example.description,
      example.fhirMessageClaim
    ])

  test.each(cases)("accepts %s", async (desc: string, input: fhir.Claim) => {
    expect(async() => await convertDispenseClaim(input, logger)).not.toThrow()
  })

  test("FHIR replacementOf gets populated in v3", async () => {
    const claim: fhir.Claim = clone(TestResources.examplePrescription3.fhirMessageClaim)
    claim.extension = [{
      url: "https://fhir.nhs.uk/StructureDefinition/Extension-replacementOf",
      valueIdentifier: {
        system: "",
        value: "bluh id"
      }
    }]
    const v3Claim = await convertDispenseClaim(claim, logger)
    expect(v3Claim.replacementOf).toBeDefined()
  })

  test("FHIR replacementOf doesn't get populated in v3", async () => {
    const claim: fhir.Claim = clone(TestResources.examplePrescription3.fhirMessageClaim)
    const v3Claim = await convertDispenseClaim(claim, logger)
    expect(v3Claim.replacementOf).toBeUndefined()
  })

  test("No chargeExemptionCoding results in no v3.coverage", async () => {
    const claim: fhir.Claim = clone(TestResources.examplePrescription3.fhirMessageClaim)
    claim.item[0].programCode = []
    const v3Claim = await convertDispenseClaim(claim, logger)
    expect(v3Claim.coverage).toBeUndefined()
  })

  test("chargeExemptionCoding with no evidence results in v3.coverage without authorization", async () => {
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
    const v3Claim = await convertDispenseClaim(claim, logger)
    expect(v3Claim.coverage).toBeDefined()
    expect(v3Claim.coverage.coveringChargeExempt.authorization).toBeUndefined()
  })

  test("chargeExemptionCoding with evidence results in v3.coverage with authorization", async () => {
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
    const v3Claim = await convertDispenseClaim(claim, logger)
    expect(v3Claim.coverage).toBeDefined()
    expect(v3Claim.coverage.coveringChargeExempt.authorization).toBeDefined()
  })
})

describe("createSuppliedLineItem", () => {
  test("FHIR with no statusReasonExtension should not populate suppliedLineItem.pertinentInformation2", async () => {
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
    const v3Claim = await convertDispenseClaim(claim, logger)
    v3Claim.pertinentInformation1.pertinentSupplyHeader.pertinentInformation1.forEach(pertinentInformation1 => {
      expect(pertinentInformation1.pertinentSuppliedLineItem.pertinentInformation2).toBeUndefined()
    })
  })

  test("FHIR statusReasonExtension should populate suppliedLineItem.pertinentInformation2", async () => {
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

    const v3Claim = await convertDispenseClaim(claim, logger)
    v3Claim.pertinentInformation1.pertinentSupplyHeader.pertinentInformation1.forEach(pertinentInformation1 => {
      expect(pertinentInformation1.pertinentSuppliedLineItem.pertinentInformation2).toBeDefined()
    })
  })

  test("FHIR with no subDetail should not populate suppliedLineItem.component", async () => {
    const claim: fhir.Claim = clone(TestResources.examplePrescription3.fhirMessageClaim)
    claim.item[0].detail.forEach(detail => delete detail.subDetail)
    const v3Claim = await convertDispenseClaim(claim, logger)
    v3Claim.pertinentInformation1.pertinentSupplyHeader.pertinentInformation1.forEach(pertinentInformation1 => {
      expect(pertinentInformation1.pertinentSuppliedLineItem.component).toBeUndefined()
    })
  })
})

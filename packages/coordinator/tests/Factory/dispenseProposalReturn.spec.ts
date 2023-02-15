import {DispenseProposalReturnFactory} from "../../src/services/translation/request/return/return-factory"
import {
  DispenseProposalReturnPertinentInformation1,
  DispenseProposalReturnPertinentInformation3,
  DispenseProposalReturnReversalOf,
  DispenseProposalReturnRoot,
  ReturnReasonCode,
  Timestamp
} from "../../../models/hl7-v3"
import {getExamplePrescriptionReleaseResponse} from "../resources/test-resources"
import {getParentPrescription} from "../resources/test-helpers"

describe("create", () => {
  const returnPayloadFactory = new DispenseProposalReturnFactory()
  const releaseResponse = getExamplePrescriptionReleaseResponse("release_success.xml")
  const prescription = getParentPrescription(releaseResponse)
  const returnReasonCode = new ReturnReasonCode("0005", "Invalid digital signature")
  const result = returnPayloadFactory.create(prescription, releaseResponse, returnReasonCode)
  const dispenseProposalReturnResult = result.DispenseProposalReturn
  const author = prescription.pertinentInformation1.pertinentPrescription.author
  test("should return instance of DispenseProposalReturnRoot", () => {
    expect(result).toBeInstanceOf(DispenseProposalReturnRoot)
  })

  test("should return DispenseProposalReturnRoot with prescription id", () => {
    expect(dispenseProposalReturnResult.id).toEqual(prescription.id)
  })

  test("should return DispenseProposal with dateTime from effectiveTime", () => {
    expect(dispenseProposalReturnResult.effectiveTime).toEqual(releaseResponse.effectiveTime)
  })

  describe("DispenseProposalReturn should have", () => {
    test("author set from release response auther", () => {
      const authorName = author.AgentPerson.agentPerson.name.family._text
      const authorOrganisation = author.AgentPerson.representedOrganization.name._text
      expect(dispenseProposalReturnResult.author.AgentPerson).toEqual(author.AgentPerson)
      expect(authorName).toBe("BOIN")
      expect(authorOrganisation).toBe("HALLGARTH SURGERY")
    })

    test("author set as SDS role from release response", () => {
      const sdsCode = author.AgentPerson.code._attributes.code
      expect(dispenseProposalReturnResult.author.AgentPerson).toEqual(author.AgentPerson)
      expect(sdsCode).toBe("R8000")
    })

    test("pertinentInformation1 is instance of DispenseProposalReturnPertinentInformation1", () => {
      expect(dispenseProposalReturnResult.pertinentInformation1)
        .toBeInstanceOf(DispenseProposalReturnPertinentInformation1)
    })

    test("pertinentInformation1 set with prescriptionId", () => {
      const actualId = dispenseProposalReturnResult
        .pertinentInformation1
        .pertinentPrescriptionID.value._attributes.extension
      const expectedId = prescription.id._attributes.root
      expect(actualId).toEqual(expectedId)
    })

    test("pertinentInformation3 is instance of DispenseProposalReturnPertinentInformation3", () => {
      expect(dispenseProposalReturnResult.pertinentInformation3)
        .toBeInstanceOf(DispenseProposalReturnPertinentInformation3)
    })

    test("returnReasonValue set with provided value", () => {
      const expectedReturnReason = returnReasonCode
      const actualReturnReason = dispenseProposalReturnResult.pertinentInformation3.pertinentReturnReason.value
      expect(actualReturnReason).toEqual(expectedReturnReason)
    })

    test("reverseOf is instance of DispenseProposalReturnReversalOf", () => {
      expect(dispenseProposalReturnResult.reversalOf).toBeInstanceOf(DispenseProposalReturnReversalOf)
    })

  })
})

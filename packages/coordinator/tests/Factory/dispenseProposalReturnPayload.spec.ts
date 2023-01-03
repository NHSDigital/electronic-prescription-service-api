import {DispenseReturnPayloadFactory} from "../../src/services/translation/request/return/payload/return-payload-factory"
import {Author, DispenseProposalReturn, DispenseProposalReturnPertinentInformation1, DispenseProposalReturnPertinentInformation3, DispenseProposalReturnReversalOf, DispenseProposalReturnRoot, GlobalIdentifier, Hl7InteractionIdentifier, PrescriptionId, PrescriptionReleaseResponseRef, ReturnReason, ReturnReasonCode, Timestamp} from "../../../models/hl7-v3"
jest.mock("../../../models/hl7-v3")
describe("createPayload", () => {
  const returnPayloadFactory = new DispenseReturnPayloadFactory()
  const dispenseProposalReturnMock = new DispenseProposalReturn(
    new GlobalIdentifier("1"),
    new Timestamp("1"),
    new Author(),
    new DispenseProposalReturnPertinentInformation1(new PrescriptionId("1")),
    new DispenseProposalReturnPertinentInformation3(new ReturnReason(new ReturnReasonCode("1", "1"))),
    new DispenseProposalReturnReversalOf(new PrescriptionReleaseResponseRef("1"))
    )
  test("should return content which is instance of DispenseProposalReturnRoot", () => {

    const result = returnPayloadFactory.createPayload(new DispenseProposalReturnRoot(dispenseProposalReturnMock))
    expect(result.content).toBeInstanceOf(DispenseProposalReturnRoot)

  })

  test("should return interactionId of value DISPENSE_PROPOSAL_RETURN ", () => {
    const returnPayloadFactory = new DispenseReturnPayloadFactory()


    const result = returnPayloadFactory.createPayload(new DispenseProposalReturnRoot(dispenseProposalReturnMock))
    expect(result.interactionId).toEqual(Hl7InteractionIdentifier.DISPENSE_PROPOSAL_RETURN)

  })
})

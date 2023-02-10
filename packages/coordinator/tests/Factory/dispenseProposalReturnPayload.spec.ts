import {
  DispenseReturnPayloadFactory
} from "../../src/services/translation/request/return/payload/return-payload-factory"
import {Hl7InteractionIdentifier, ReturnReasonCode, SendMessagePayload, Timestamp} from "../../../models/hl7-v3"
import {getExamplePrescriptionReleaseResponse, validTestHeaders} from "../resources/test-resources"
import {getParentPrescription} from "../resources/test-helpers"
import {DispenseProposalReturnFactory} from "../../src/services/translation/request/return/return-factory"

describe("createPayload", () => {
  const returnPayloadFactory = new DispenseReturnPayloadFactory()
  const parentPrescription = getParentPrescription(getExamplePrescriptionReleaseResponse("release_success.xml"))
  const dateTime = new Timestamp("22220101111122")
  const dispenseProposalReturns = new DispenseProposalReturnFactory().create(
    parentPrescription,
    dateTime,
    new ReturnReasonCode("0005", "Invalid Digital Signature")
  )

  test("should return instance of SendMessagePayload", () => {
    const result = returnPayloadFactory.createPayload(dispenseProposalReturns, validTestHeaders)
    expect(result).toBeInstanceOf(SendMessagePayload)

  })

  test("should return interactionId of value DISPENSE_PROPOSAL_RETURN ", () => {
    const result = returnPayloadFactory.createPayload(dispenseProposalReturns, validTestHeaders)
    expect(result.interactionId).toEqual(Hl7InteractionIdentifier.DISPENSE_PROPOSAL_RETURN)

  })
})

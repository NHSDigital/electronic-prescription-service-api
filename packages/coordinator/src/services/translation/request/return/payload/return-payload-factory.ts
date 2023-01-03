import {hl7V3} from "../../../../../../../models"
import {
  DispenseProposalReturnRoot,
  Hl7InteractionIdentifier,
} from "../../../../../../../models/hl7-v3"


type ReturnProposal = DispenseProposalReturnRoot

export type Payload<T extends ReturnProposal> = {
  content: T,
  interactionId: Hl7InteractionIdentifier
}

interface ReturnPayloadFactory {
  createPayload(returnProposal: ReturnProposal): Payload<ReturnProposal>
}

export class DispenseReturnPayloadFactory implements ReturnPayloadFactory {
  createPayload(returnProposal: hl7V3.DispenseProposalReturnRoot): Payload<hl7V3.DispenseProposalReturnRoot> {
       return {
      content: returnProposal,
      interactionId: Hl7InteractionIdentifier.DISPENSE_PROPOSAL_RETURN
    }
  }

}

import {hl7V3} from "../../../../../../../models"
import Hapi from "hapi__hapi"
import {
  DispenseProposalReturnRoot,
  Hl7InteractionIdentifier,
} from "../../../../../../../models/hl7-v3"
import {createSendMessagePayload} from "../../payload/message"

type ReturnProposal = DispenseProposalReturnRoot

export type Payload<T extends ReturnProposal> = {
  content: T,
  interactionId: Hl7InteractionIdentifier
}

export interface ReturnPayloadFactory {
  createPayload(returnProposal: ReturnProposal, requestHeaders: Hapi.Util.Dictionary<string>): hl7V3.SendMessagePayload<Payload<ReturnProposal>>
}

export class DispenseReturnPayloadFactory implements ReturnPayloadFactory {
  createPayload(
    returnProposal: hl7V3.DispenseProposalReturnRoot, 
    requestHeaders: Hapi.Util.Dictionary<string>
    ): hl7V3.SendMessagePayload<Payload<ReturnProposal>> {
    const payload : Payload<DispenseProposalReturnRoot> = {
      content: returnProposal,
      interactionId: Hl7InteractionIdentifier.DISPENSE_PROPOSAL_RETURN
    } 
    const messageId = returnProposal.DispenseProposalReturn.id._attributes.root
    return createSendMessagePayload(messageId, payload.interactionId, requestHeaders, payload)   
  }
}

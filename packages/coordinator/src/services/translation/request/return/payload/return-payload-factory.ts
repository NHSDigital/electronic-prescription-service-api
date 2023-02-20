import {hl7V3} from "../../../../../../../models"
import Hapi from "hapi__hapi"
import {DispenseProposalReturnRoot, Hl7InteractionIdentifier} from "../../../../../../../models/hl7-v3"
import {createSendMessagePayload} from "../../payload/message"

type ReturnProposal = DispenseProposalReturnRoot

export interface ReturnPayloadFactory {
  createPayload(
    returnProposal: ReturnProposal,
    requestHeaders: Hapi.Util.Dictionary<string>
    ): hl7V3.SendMessagePayload<ReturnProposal>
}

export class DispenseReturnPayloadFactory implements ReturnPayloadFactory {
  createPayload(
    returnProposal: ReturnProposal,
    requestHeaders: Hapi.Util.Dictionary<string>
  ): hl7V3.SendMessagePayload<ReturnProposal> {
    return createSendMessagePayload(
      returnProposal.DispenseProposalReturn.id._attributes.root,
      Hl7InteractionIdentifier.DISPENSE_PROPOSAL_RETURN,
      requestHeaders,
      returnProposal)
  }
}

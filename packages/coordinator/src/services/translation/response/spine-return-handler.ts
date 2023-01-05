import {spine} from "@models"
import Hapi from "hapi__hapi"
import pino from "pino"
import {DispenseProposalReturnRoot} from "../../../../../models/hl7-v3"
import {ReturnPayloadFactory} from "../request/return/payload/return-payload-factory"
import {ReleaseResponseHandler} from "./spine-response-handler"
import * as requestBuilder from "../../communication/ebxml-request-builder"
import {createSendMessagePayload} from "../request/payload/message"
import {SpineClient, spineClient} from "../../../services/communication/spine-client"  
import {SpineResponse} from "../../../../../models/spine"

export interface SpineReturnHandler {
   handle(
    logger: pino.Logger,
    dispenseProposalReturns : DispenseProposalReturnRoot[])
    : void
}

export class DispensePropsalReturnhandler implements SpineReturnHandler {
  
  private readonly requestHeaders : Hapi.Util.Dictionary<string>
  private readonly payloadFactory: ReturnPayloadFactory
  private readonly spineClient: SpineClient

  constructor(headers: Hapi.Util.Dictionary<string>, returnPayloadFactory: ReturnPayloadFactory, spineClient : SpineClient) {
    this.requestHeaders = headers
    this.payloadFactory = returnPayloadFactory
    this.spineClient = spineClient
  }
   async handle(logger: pino.Logger<pino.LoggerOptions>, dispenseProposalReturnRoots: DispenseProposalReturnRoot[])  {
    return Promise.all(
      dispenseProposalReturnRoots.map(async proposal => {
        const payload = this.payloadFactory.createPayload(proposal, this.requestHeaders)
        const request = requestBuilder.toSpineRequest(payload, this.requestHeaders)
        const response = await spineClient.send(request, logger)
        if(response.statusCode  != 201 || 200) {
          const prescriptionId = proposal.DispenseProposalReturn.id 
          logger.error(`Prescription return failed for prescription ID${prescriptionId}. Status code: ${response.statusCode}`)
        }
      })
    )
  }
}
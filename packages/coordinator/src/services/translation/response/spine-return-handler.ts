import Hapi from "hapi__hapi"
import pino from "pino"
import {DispenseProposalReturnRoot} from "../../../../../models/hl7-v3"
import {ReturnPayloadFactory} from "../request/return/payload/return-payload-factory"
import * as requestBuilder from "../../communication/ebxml-request-builder"
import {SpineClient, spineClient} from "../../../services/communication/spine-client"

export interface SpineReturnHandler {
   handle(
    logger: pino.Logger,
    dispenseProposalReturns : Array<DispenseProposalReturnRoot>)
    : void
}

export class DispensePropsalReturnHandler implements SpineReturnHandler {

  private readonly requestHeaders : Hapi.Util.Dictionary<string>
  private readonly payloadFactory: ReturnPayloadFactory
  private readonly spineClient: SpineClient

  constructor(
    headers: Hapi.Util.Dictionary<string>,
    returnPayloadFactory: ReturnPayloadFactory,
    spineClient : SpineClient) {
    this.requestHeaders = headers
    this.payloadFactory = returnPayloadFactory
    this.spineClient = spineClient
  }
  handle(logger: pino.Logger<pino.LoggerOptions>,
    dispenseProposalReturnRoots: Array<DispenseProposalReturnRoot>) : void {
    const successStatusCodes = 200 || 201
    Promise.all(
      dispenseProposalReturnRoots.map(async proposal => {
        const payload = this.payloadFactory.createPayload(proposal, this.requestHeaders)
        const request = requestBuilder.toSpineRequest(payload, this.requestHeaders)
        const response = await spineClient.send(request, logger)
        if(response.statusCode !== successStatusCodes) {
          const prescriptionId = proposal.DispenseProposalReturn.id
          logger.error(
            `Prescription return failed for prescription ID: ${prescriptionId}. Status code: ${response.statusCode}`)
        }
      })
    ).catch(rejectedPromise => {
      logger.error(`${rejectedPromise}, Prescription return failed to complete`)
    })
  }

}

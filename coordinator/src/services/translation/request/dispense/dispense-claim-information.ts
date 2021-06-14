import {fhir, hl7V3} from "@models"
import {
  getMessageId
} from "../../common"
import pino from "pino"

export async function convertDispenseClaimInformation(
  bundle: fhir.Bundle,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  logger: pino.Logger
): Promise<hl7V3.DispenseClaimInformation> {

  const messageId = getMessageId([bundle.identifier], "Bundle.identifier")

  const hl7DispenseClaimInformation = new hl7V3.DispenseClaimInformation(new hl7V3.GlobalIdentifier(messageId))

  // todo dispense-claim-information: translation

  return hl7DispenseClaimInformation
}

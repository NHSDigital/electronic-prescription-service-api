import {
  DispenseProposalReturn,
  DispenseProposalReturnPertinentInformation1,
  DispenseProposalReturnPertinentInformation3,
  DispenseProposalReturnReversalOf,
  DispenseProposalReturnRoot,
  GlobalIdentifier,
  ParentPrescription,
  PrescriptionAuthor,
  PrescriptionId,
  PrescriptionReleaseResponse,
  PrescriptionReleaseResponseRef,
  ReturnReason,
  ReturnReasonCode
} from "../../../../../../models/hl7-v3"
import * as uuid from "uuid"
import pino from "pino"

type ReturnProposal = DispenseProposalReturnRoot
export interface ReturnFactory {
  create(
    parentPrescription: ParentPrescription,
    releaseResponse: PrescriptionReleaseResponse,
    returnReasonCode: ReturnReasonCode,
    logger: pino.Logger
    ): ReturnProposal
}

export class DispenseProposalReturnFactory implements ReturnFactory {

  create(
    parentPrescription: ParentPrescription,
    releaseResponse: PrescriptionReleaseResponse,
    returnReasonCode: ReturnReasonCode,
    logger: pino.Logger
  ): DispenseProposalReturnRoot {
    const pertinentPrescription = parentPrescription.pertinentInformation1.pertinentPrescription
    const prescriptionIdString = pertinentPrescription.id[1]._attributes.extension
    const reversalOf = this.getReversalOf(releaseResponse.id._attributes.root)
    const prescriptionId = this.convertPrescriptionId(prescriptionIdString)
    const returnMessageId = uuid.v4()
    logger.info(`Generating auto return message: ${returnMessageId} for prescription: ${prescriptionIdString}`)
    const dispenseProposalReturn = new DispenseProposalReturn(
      new GlobalIdentifier(returnMessageId),
      releaseResponse.effectiveTime,
      this.getAuthor(parentPrescription),
      this.getPertinentInformation1(prescriptionId),
      this.getPertinentInformation3(this.getReturnReason(returnReasonCode)),
      reversalOf
    )

    return new DispenseProposalReturnRoot(dispenseProposalReturn)
  }

  private convertPrescriptionId = ( id :string) : PrescriptionId => new PrescriptionId(id)

  private getPertinentInformation1 = (prescriptionId : PrescriptionId
  ) : DispenseProposalReturnPertinentInformation1 =>
    new DispenseProposalReturnPertinentInformation1(prescriptionId)

  private getPertinentInformation3 = (returnReason : ReturnReason
  ) : DispenseProposalReturnPertinentInformation3 =>
    new DispenseProposalReturnPertinentInformation3(returnReason)

  private getReturnReason = (returnReasonCode: ReturnReasonCode
  ) : ReturnReason => new ReturnReason(returnReasonCode)

  private getReversalOf = ( id :string
  ) : DispenseProposalReturnReversalOf => new DispenseProposalReturnReversalOf(
    new PrescriptionReleaseResponseRef(id)
  )

  private getAuthor = (prescription: ParentPrescription
  ) : PrescriptionAuthor => prescription
    .pertinentInformation1
    .pertinentPrescription
    .author

}

import {
  DispenseProposalReturn,
  DispenseProposalReturnPertinentInformation1,
  DispenseProposalReturnPertinentInformation3,
  DispenseProposalReturnReversalOf,
  DispenseProposalReturnRoot,
  ParentPrescription,
  PrescriptionAuthor,
  PrescriptionId,
  PrescriptionReleaseResponseRef,
  ReturnReason,
  ReturnReasonCode
} from "../../../../../../models/hl7-v3"

type ReturnProposal = DispenseProposalReturnRoot

export interface ReturnFactory {
  create(parentPrescription: ParentPrescription, returnReasonCode: ReturnReasonCode): ReturnProposal
}

export class DispenseProposalReturnFactory implements ReturnFactory {

  create(parentPrescription: ParentPrescription, returnReasonCode: ReturnReasonCode): DispenseProposalReturnRoot {
    const prescriptionIdString = parentPrescription.id._attributes.root.toString()
    const reversalOf = this.getReversalOf(prescriptionIdString)
    const prescriptionId = this.convertPrescriptionId(prescriptionIdString)
    const dispenseProposalReturn = new DispenseProposalReturn(
      parentPrescription.id,
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

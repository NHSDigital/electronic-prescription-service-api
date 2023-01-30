import {
  DispenseProposalReturn,
  DispenseProposalReturnPertinentInformation1,
  DispenseProposalReturnPertinentInformation3,
  DispenseProposalReturnReversalOf,
  DispenseProposalReturnRoot,
  PrescriptionAuthor,
  PrescriptionId,
  PrescriptionReleaseResponse,
  PrescriptionReleaseResponseComponent,
  PrescriptionReleaseResponseRef,
  ReturnReason,
  ReturnReasonCode
} from "../../../../../../models/hl7-v3"

type response = PrescriptionReleaseResponse
type ReturnProposal = DispenseProposalReturnRoot

export interface ReturnFactory {
  create(response: response, returnReasonCode: ReturnReasonCode): ReturnProposal
}

export class DispenseProposalReturnFactory implements ReturnFactory {

  create(response: PrescriptionReleaseResponse, returnReasonCode: ReturnReasonCode): DispenseProposalReturnRoot {
    const prescription = this.getPrescription(response)
    const prescriptionIdString = prescription.ParentPrescription.id._attributes.root.toString()
    const prescriptionId = this.getPrescriptionId(prescriptionIdString)
    const reversalOf = this.getReversalOf(prescriptionIdString)

    const dispenseProposalReturn = new DispenseProposalReturn(
      response.id,
      response.effectiveTime,
      this.getAuthor(prescription),
      this.getPertinentInformation1(prescriptionId),
      this.getPertinentInformation3(this.getReturnReason(returnReasonCode)),
      reversalOf
    )

    return new DispenseProposalReturnRoot(dispenseProposalReturn)
  }

  private getPrescriptionId = ( id :string) : PrescriptionId => new PrescriptionId(id)

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

  private getPrescription = (releaseResponse: PrescriptionReleaseResponse
  ) : PrescriptionReleaseResponseComponent => Array.isArray(
    releaseResponse.component) ?
    releaseResponse.component[0] :
    releaseResponse.component

  private getAuthor = (prescription: PrescriptionReleaseResponseComponent
  ) : PrescriptionAuthor => prescription
    .ParentPrescription
    .pertinentInformation1
    .pertinentPrescription
    .author

}

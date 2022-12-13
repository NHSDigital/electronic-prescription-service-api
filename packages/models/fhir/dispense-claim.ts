import * as common from "./common"
import * as extension from "./extension"
import * as practitionerRole from "./practitioner-role"
import * as medicationRequest from "./medication-request"
import {LosslessNumber} from "lossless-json"
import {MedicationRequest} from "./medication-request"

/**
 * Details of the claim itself
 */
export interface Claim extends common.Resource {
  resourceType: "Claim"
  identifier: Array<common.Identifier>
  created: string
  prescription: ClaimPrescription
  provider: common.Reference<practitionerRole.PractitionerRole>
  payee: ClaimPayee
  insurance: Array<ClaimInsurance>
  item: Array<ClaimItem>
  extension: Array<extension.IdentifierExtension>
}

export interface ClaimPrescription extends common.IdentifierReference<medicationRequest.MedicationRequest> {
  extension: Array<extension.GroupIdentifierExtension>
}

export interface ClaimPayee {
  party: common.Reference<practitionerRole.Organization>
}

export interface ClaimInsurance {
  coverage: common.IdentifierReference<common.Resource>
}

/**
 * Details of the prescription
 */
export interface ClaimItem extends BaseClaimItemDetail {
  extension: Array<extension.IdentifierExtension | extension.CodingExtension>
  detail: Array<ClaimItemDetail>
}

/**
 * Details of the line item
 */
export interface ClaimItemDetail extends BaseClaimItemDetail {
  // eslint-disable-next-line max-len
  extension: Array<extension.IdentifierReferenceExtension<MedicationRequest> | extension.CodingExtension | extension.IdentifierExtension>
  subDetail: Array<ClaimItemSubDetail>
}

/**
 * Details of the dispense event
 */
export type ClaimItemSubDetail = BaseClaimItemDetail

interface BaseClaimItemDetail {
  sequence: string | LosslessNumber
  productOrService: common.CodeableConcept
  modifier: Array<common.CodeableConcept>
  programCode: Array<common.CodeableConcept>
  quantity: common.SimpleQuantity
}

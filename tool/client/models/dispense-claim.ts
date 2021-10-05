import * as common from "./common"
import * as extension from "./extension"
import * as practitionerRole from "./practitioner-role"
import * as medicationRequest from "./medication-request"
import * as patient from "./patient"

/**
 * Details of the claim itself
 */
export interface Claim extends common.Resource {
  resourceType: "Claim"
  identifier: Array<common.Identifier>
  status: "active"
  type: common.CodeableConcept
  use: "claim"
  patient: common.IdentifierReference<patient.Patient>
  created: string
  provider: common.IdentifierReference<practitionerRole.PractitionerRole>
  priority: common.CodeableConcept
  prescription: ClaimPrescription
  payee: ClaimPayee
  insurance: Array<ClaimInsurance>
  item: Array<ClaimItem>
}

export interface ClaimPrescription {
  extension: Array<extension.GroupIdentifierExtension>
}

export interface ClaimPayee {
  type: common.CodeableConcept
  party: common.IdentifierReference<practitionerRole.PersonOrOrganization>
}

export interface ClaimInsurance {
  sequence: number,
  focal: boolean,
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
  extension: Array<extension.IdentifierExtension
    | extension.IdentifierReferenceExtension<medicationRequest.MedicationRequest>>
  subDetail: Array<ClaimItemSubDetail>
}

/**
 * Details of the dispense event
 */
export type ClaimItemSubDetail = BaseClaimItemDetail

interface BaseClaimItemDetail {
  sequence: number
  productOrService: common.CodeableConcept
  modifier?: Array<common.CodeableConcept>
  programCode?: Array<common.CodeableConcept>
  quantity?: common.SimpleQuantity
}

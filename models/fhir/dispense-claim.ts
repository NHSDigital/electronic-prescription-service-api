import * as common from "./common"
import * as extension from "./extension"
import * as practitionerRole from "./practitioner-role"
import * as medicationRequest from "./medication-request"
import {LosslessNumber} from "lossless-json"

export interface Claim extends common.Resource {
  resourceType: "Claim"
  identifier: Array<common.Identifier>
  prescription: ClaimPrescription
  payee: ClaimPayee
  item: Array<ClaimItem>
}

export interface ClaimPrescription extends common.IdentifierReference<medicationRequest.MedicationRequest> {
  extension: Array<extension.GroupIdentifierExtension>
}

export interface ClaimPayee {
  party: common.IdentifierReference<practitionerRole.PersonOrOrganization>
}

export interface ClaimItem {
  extension: Array<extension.IdentifierExtension | extension.CodingExtension>
  sequence: string | LosslessNumber
  productOrService: common.CodeableConcept
  modifier: Array<common.CodeableConcept>
  programCode: Array<common.CodeableConcept>
  quantity: common.SimpleQuantity
  detail: Array<ClaimItemDetail>
}

export interface ClaimItemDetail {
  sequence: string | LosslessNumber
  productOrService: common.CodeableConcept
  programCode: Array<common.CodeableConcept>
  quantity: common.SimpleQuantity
}

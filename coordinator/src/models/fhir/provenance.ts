import * as medicationRequest from "./medication-request"
import * as common from "./common"
import * as practitionerRole from "./practitioner-role"

export class Provenance extends common.Resource {
  readonly resourceType = "Provenance"
  signature: Array<Signature>
  target: Array<common.Reference<medicationRequest.MedicationRequest>>
}

export interface Signature {
  when: string
  who: common.Reference<practitionerRole.PractitionerRole>
  data: string
}

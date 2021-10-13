import * as common from "./common"
import {Coding} from "./common"
import * as medicationRequest from "./medication-request"
import * as practitionerRole from "./practitioner-role"

export class Provenance extends common.Resource {
  readonly resourceType = "Provenance"
  agent?: Array<ProvenanceAgent>
  recorded?: string
  signature: Array<Signature>
  target: Array<common.Reference<medicationRequest.MedicationRequest>>
}

export interface Signature {
  when: string
  who: common.Reference<practitionerRole.PractitionerRole>
  data: string
  type?: Array<Coding>
}

export interface ProvenanceAgent {
  who: common.Reference<practitionerRole.PractitionerRole>
}

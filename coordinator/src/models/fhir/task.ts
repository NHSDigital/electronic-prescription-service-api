import * as common from "./common"
import * as bundle from "./bundle"
import * as patient from "./patient"
import * as practitionerRole from "./practitioner-role"

export class Task extends common.Resource {
  readonly resourceType = "Task"
  identifier: Array<common.Identifier>
  groupIdentifier: common.Identifier
  status: TaskStatus
  intent: TaskIntent
  focus: common.IdentifierReference<bundle.Bundle>
  for: common.IdentifierReference<patient.Patient>
  authoredOn: string
  owner: TaskOwner
  reasonCode: common.CodeableConcept
  code?: common.CodeableConcept
}

export type TaskOwner = common.IdentifierReference<practitionerRole.PractitionerRole | practitionerRole.Practitioner
  | practitionerRole.Organization>

export enum TaskStatus {
  IN_PROGRESS = "in-progress",
  REJECTED = "rejected"
}

export enum TaskIntent {
  ORDER = "order"
}

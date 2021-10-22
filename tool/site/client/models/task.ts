import * as common from "./common"

export class Task extends common.Resource {
  readonly resourceType = "Task"
  identifier: Array<common.Identifier>
  groupIdentifier: common.Identifier
  status: TaskStatus
  intent: TaskIntent
  focus: common.IdentifierReference<any>
  for: common.IdentifierReference<any>
  authoredOn: string
  owner: common.IdentifierReference<any>
  reasonCode: common.CodeableConcept
  code?: common.CodeableConcept
}

export enum TaskStatus {
  IN_PROGRESS = "in-progress",
  REJECTED = "rejected"
}

export enum TaskIntent {
  ORDER = "order"
}

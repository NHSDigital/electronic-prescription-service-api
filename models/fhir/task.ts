import * as common from "./common"
import * as bundle from "./bundle"
import * as patient from "./patient"
import * as practitionerRole from "./practitioner-role"
import * as medicationRequest from "./medication-request"
import * as medicationDispense from "./medication-dispense"

export class Task extends common.Resource {
  readonly resourceType = "Task"
  identifier: Array<common.Identifier>
  groupIdentifier?: common.Identifier
  status: TaskStatus
  intent: TaskIntent
  focus: common.IdentifierReference<bundle.Bundle>
  for: common.IdentifierReference<patient.Patient>
  authoredOn: string
  requester?: common.IdentifierReference<practitionerRole.PersonOrOrganization>
  owner: common.IdentifierReference<practitionerRole.PersonOrOrganization>
  reasonCode?: common.CodeableConcept
  code?: common.CodeableConcept
  businessStatus?: common.CodeableConcept
  input?: Array<TaskInput>
  output?: Array<TaskOutput>
}

interface TaskInput {
  extension?: Array<medicationRequest.DispensingInformationExtension>
  type: common.CodeableConcept
  valueReference: common.IdentifierReference<medicationRequest.MedicationRequest>
}

interface TaskOutput {
  extension?: Array<medicationRequest.DispensingReleaseInformationExtension>
  type: common.CodeableConcept
  valueReference: common.IdentifierReference<medicationDispense.MedicationDispense>
}

export enum TaskStatus {
  IN_PROGRESS = "in-progress",
  REJECTED = "rejected"
}

export enum TaskIntent {
  ORDER = "order"
}

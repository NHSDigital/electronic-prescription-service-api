import * as common from "./common"
import {Bundle} from "./bundle"
import {CodeableConcept} from "./common"

export class Task extends common.Resource {
  readonly resourceType = "Task"
  identifier: Array<common.Identifier>
  groupIdentifier: common.Identifier
  status: string
  intent: string
  focus: common.Reference<Bundle>
  for: common.Reference<common.Resource>
  authoredOn: string
  owner: common.Reference<common.Resource>
  reasonCode: CodeableConcept
  code?: CodeableConcept
}

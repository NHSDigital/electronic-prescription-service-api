import * as common from "./common"
import * as task from "./task"

export interface Bundle extends common.Resource {
  resourceType: "Bundle"
  identifier?: common.Identifier
  entry?: Array<BundleEntry>
  total?: number
  type?: string
  timestamp?: string
}

export interface BundleEntry {
  fullUrl?: string
  resource?: common.Resource | task.Task
}

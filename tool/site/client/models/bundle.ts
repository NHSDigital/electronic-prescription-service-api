import * as common from "./common"

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
  resource?: common.Resource
}

export interface BundleEntryGeneric<T extends common.Resource> extends BundleEntry {
  resource?: T
}

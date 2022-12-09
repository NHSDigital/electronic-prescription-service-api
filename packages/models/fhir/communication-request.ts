import * as common from "./common"
import * as patient from "./patient"
import * as organization from "./practitioner-role"

export interface CommunicationRequest extends common.Resource {
  resourceType: "CommunicationRequest"
  status?: string
  subject: common.Reference<patient.Patient>
  payload: Array<ContentStringPayload | ContentReferencePayload>
  requester: common.IdentifierReference<organization.Organization>
  recipient: Array<common.IdentifierReference<patient.Patient>>
}

export interface ContentStringPayload {
  contentString: string
}

export interface ContentReferencePayload {
  contentReference: common.Reference<List>
}

export function isContentStringPayload(
  payload: ContentStringPayload | ContentReferencePayload
): payload is ContentStringPayload {
  return !!(payload as ContentStringPayload).contentString
}

export function isContentReferencePayload(
  payload: ContentStringPayload | ContentReferencePayload
): payload is ContentReferencePayload {
  return !!(payload as ContentReferencePayload).contentReference
}

export interface List extends common.Resource {
  resourceType: "List"
  status: string
  mode: string
  entry: Array<ListEntry>
}

export interface ListEntry {
  item: {
    display: string
  }
}

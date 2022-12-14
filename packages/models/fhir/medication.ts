import * as common from "./common"

export interface Medication extends common.Resource {
  resourceType: "Medication"
  code: common.CodeableConcept
}

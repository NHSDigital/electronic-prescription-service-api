import {fhir} from "@models"
import {practitionerRole} from "../practitioner-role"

export const agentParameter: fhir.ResourceParameter<fhir.PractitionerRole> = {
  name: "agent",
  resource: practitionerRole
}

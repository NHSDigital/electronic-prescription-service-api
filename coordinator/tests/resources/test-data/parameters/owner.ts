import {fhir} from "@models"
import {organization} from "../organization"

export const ownerParameter: fhir.ResourceParameter<fhir.Organization> = {
    name: "owner",
    resource: organization
  }
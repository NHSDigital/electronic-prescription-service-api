import {fhir} from "@models"
import {practitionerRole} from "."

export const practitionerRoleOrganisationRef: fhir.PractitionerRole = {
  ...practitionerRole,
  organization: {
    reference: "urn:uuid:2bf9f37c-d88b-4f86-ad5f-373c1416e04b"
  }
}

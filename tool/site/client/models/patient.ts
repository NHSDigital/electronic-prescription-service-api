import * as demographics from "./demographics"
import * as practitionerRole from "./practitioner-role"
import * as common from "./common"
import * as extension from "./extension"

export class Patient extends common.Resource {
  readonly resourceType = "Patient"
  identifier?: Array<PatientIdentifier>
  name?: Array<demographics.HumanName>
  telecom?: Array<demographics.ContactPoint>
  gender?: string
  birthDate?: string
  address?: Array<demographics.Address>
  generalPractitioner?: Array<common.IdentifierReference<practitionerRole.Organization>>
}

export interface PatientIdentifier extends common.Identifier {
  extension: Array<extension.CodeableConceptExtension>
}

import * as demographics from "./demographics"
import * as practitionerRole from "./practitioner-role"
import * as common from "./common"

const GP_PRACTICE_CODE_NOT_KNOWN = "V81999"

function unknownGPPractice() {
  const unknownGP: common.IdentifierReference<practitionerRole.Organization> = {
    identifier: {
      system: "http://hl7.org/fhir/sid/us-npi",
      value: GP_PRACTICE_CODE_NOT_KNOWN
    }
  }
  return unknownGP
}

export class Patient extends common.Resource {
  readonly resourceType = "Patient"
  identifier?: Array<PatientIdentifier>
  name?: Array<demographics.HumanName>
  telecom?: Array<demographics.ContactPoint>
  gender?: string
  birthDate?: string
  address?: Array<demographics.Address>

  private _generalPractitioner?: Array<common.IdentifierReference<practitionerRole.Organization>>

  get generalPractitioner(): Array<common.IdentifierReference<practitionerRole.Organization>> {
    if (!this._generalPractitioner) {
      // Provide a default value if none is set
      const defaultGP = unknownGPPractice()
      this._generalPractitioner = [defaultGP]
    }
    return this._generalPractitioner
  }

  set generalPractitioner(
    value: Array<common.IdentifierReference<practitionerRole.Organization>> | undefined
  ) {
    this._generalPractitioner = value
  }
}

export type PatientIdentifier = common.Identifier

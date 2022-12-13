import {ElementCompact} from "xml-js"
import * as core from "./core"

export enum AddressUse {
  HOME = "H",
  PRIMARY_HOME = "HP",
  TEMPORARY = "TMP",
  POSTAL = "PST",
  WORK = "WP",
  BUSINESS = "BP"
}

export class Address implements ElementCompact {
  _attributes: {
    use?: AddressUse
  }
  _text?: string
  streetAddressLine?: Array<core.Text>
  postalCode?: core.Text
}

export enum NameUse {
  USUAL = "L",
  ALIAS = "A",
  PREFERRED = "PREFERRED",
  PREVIOUS = "PREVIOUS",
  PREVIOUS_BIRTH = "PREVIOUS-BIRTH",
  PREVIOUS_MAIDEN = "PREVIOUS-MAIDEN",
  PREVIOUS_BACHELOR = "PREVIOUS-BACHELOR"
}

export class Name implements ElementCompact {
  _attributes: {
    use?: NameUse
  }

  _text?: string

  family?: core.Text
  given?: core.Text | Array<core.Text>
  prefix?: core.Text | Array<core.Text>
  suffix?: core.Text | Array<core.Text>
}

export enum TelecomUse {
  HOME = "H",
  PERMANENT_HOME = "HP",
  TEMPORARY = "HV",
  WORKPLACE = "WP",
  ANSWERING_MACHINE = "AS",
  MOBILE = "MC",
  PAGER = "PG",
  EMERGENCY_CONTACT = "EC"
}

export class Telecom implements ElementCompact {
  _attributes: {
    use?: TelecomUse
    value?: string
  }
}

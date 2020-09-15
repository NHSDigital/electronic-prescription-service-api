import {LosslessNumber} from "lossless-json"

export abstract class Resource {
  id?: string
  resourceType: string
}

export class Bundle extends Resource {
  readonly resourceType = "Bundle"
  identifier?: Identifier
  entry?: Array<BundleEntry>
}

class BundleEntry {
  fullUrl?: string
  resource?: Resource
}

export interface Identifier {
  use?: string
  system?: string
  value?: string
}

export interface MedicationRequestGroupIdentifier extends Identifier {
  extension: Array<IdentifierExtension>
}

export interface RepeatInformationExtension extends Extension {
  extension: Array<UnsignedIntExtension | DateTimeExtension>
}

export interface MedicationRequest extends Resource {
  resourceType: "MedicationRequest"
  identifier: Array<Identifier>
  category?: Array<CodeableConcept>
  medicationCodeableConcept: CodeableConcept
  subject: Reference<Patient>
  authoredOn: string
  requester: Reference<PractitionerRole>
  groupIdentifier: MedicationRequestGroupIdentifier
  courseOfTherapyType: CodeableConcept
  dosageInstruction: Array<Dosage>
  dispenseRequest: MedicationRequestDispenseRequest
  extension: Array<IdentifierExtension | ReferenceExtension<PractitionerRole> | CodingExtension | CodeableConceptExtension | RepeatInformationExtension>
}

export interface CodeableConcept {
  coding: Array<Coding>
}

export interface Coding {
  system: string
  code: string
  display?: string
  version?: number
}

export interface Reference<T extends Resource> {
  reference: string
}

export interface IdentifierReference<T extends Resource> {
  identifier: Identifier
}

export interface Dosage {
  text: string
  patientInstruction?: string
}

export interface MedicationRequestDispenseRequest {
  extension: Array<CodingExtension | StringExtension>
  quantity: SimpleQuantity
  expectedSupplyDuration?: SimpleQuantity
  performer: IdentifierReference<Organization>
  validityPeriod?: Period
}

export interface SimpleQuantity {
  value: string | LosslessNumber
  unit: string
  system?: string
  code: string
}

export class Patient extends Resource {
  readonly resourceType = "Patient"
  identifier?: Array<Identifier>
  name?: Array<HumanName>
  telecom?: Array<ContactPoint>
  gender?: string
  birthDate?: string
  address?: Array<Address>
  generalPractitioner?: Array<Reference<PractitionerRole>>
  managingOrganization: IdentifierReference<Organization>
}

export class HumanName {
  use?: string
  family?: string
  given?: Array<string>
  prefix?: Array<string>
  suffix?: Array<string>
}

export class ContactPoint {
  system?: string
  value?: string
  use?: string
  rank?: number //TODO use this as a tie-breaker
}

export class Address {
  use?: string
  type?: string
  text?: string
  line?: Array<string>
  city?: string
  district?: string
  state?: string
  postalCode?: string
}

export class PractitionerRole extends Resource {
  readonly resourceType = "PractitionerRole"
  identifier?: Array<Identifier>
  practitioner?: Reference<Practitioner>
  organization?: Reference<Organization>
  code?: Array<CodeableConcept>
  healthcareService?: Array<Reference<HealthcareService>>
  telecom: Array<ContactPoint>
}

export class Practitioner extends Resource {
  readonly resourceType = "Practitioner"
  identifier?: Array<Identifier>
  name?: Array<HumanName>
  telecom?: Array<ContactPoint>
  address?: Array<Address>
}

export interface Organization extends Resource {
  readonly resourceType: "Organization"
  identifier?: Array<Identifier>
  type?: Array<CodeableConcept>
  name?: string
  telecom?: Array<ContactPoint>
  address?: Array<Address>
  partOf?: Reference<Organization>
}

export interface HealthcareService extends Resource {
  resourceType: "HealthcareService"
  identifier?: Array<Identifier>
  id?: string
  name?: string
  telecom?: Array<ContactPoint>
  active?: string
  providedBy?: {identifier: Identifier}
  location?: Array<Reference<Location>>
}

export interface Location extends Resource {
  resourceType: "Location"
  id?: string
  identifier?: Array<Identifier>
  status?: string
  mode?: string
  address?: Address
}

export interface OperationOutcomeIssue {
  severity: "information" | "warning" | "error" | "fatal"
  code: "informational" | "value" | "invalid"
  details?: CodeableConcept
  diagnostics?: string
  expression?: string
}

export interface OperationOutcome extends Resource {
  resourceType: "OperationOutcome"
  issue: Array<OperationOutcomeIssue>
}

export class Parameters extends Resource {
  readonly resourceType = "Parameters"
  parameter: Array<Parameter>

  constructor(parameters: Array<Parameter>) {
    super()
    this.parameter = parameters
  }
}

export class Parameter {
  name: string
  valueString: string
}

export interface Extension {
  url: string
}

export interface IdentifierExtension extends Extension {
  valueIdentifier: Identifier
}

export interface CodingExtension extends Extension {
  valueCoding: Coding
}

export interface CodeableConceptExtension extends Extension {
  valueCodeableConcept: CodeableConcept
}

export interface StringExtension extends Extension {
  valueString: string
}

export interface ReferenceExtension<T extends Resource> extends Extension {
  valueReference: Reference<T>
}

export interface UnsignedIntExtension extends Extension {
  valueUnsignedInt: LosslessNumber | string
}

export interface DateTimeExtension extends Extension {
  valueDateTime: string
}

class Signature {
  who: Reference<PractitionerRole>
  data: string
}

export class Provenance extends Resource {
  readonly resourceType = "Provenance"
  signature: Array<Signature>
}

export class Period {
  start: string
  end: string
}

export interface CommunicationRequest extends Resource {
  resourceType: "CommunicationRequest"
  status?: string
  subject: Reference<Patient>
  payload: Array<ContentReference | ContentString>
}

export interface ContentString {
  contentString: string
}

export interface ContentReference {
  reference: string
  display: string
}

interface BackboneElement {
  name?: string
  endpoint: string
}

export interface MessageHeader extends Resource {
  resourceType: "MessageHeader",
  eventCoding: Coding,
  sender: Reference<PractitionerRole>
  source: BackboneElement
  focus: Array<Reference<Resource>>
}

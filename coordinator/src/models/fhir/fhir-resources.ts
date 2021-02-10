import {LosslessNumber} from "lossless-json"

export abstract class Resource {
  id?: string
  resourceType: string
}

export interface Bundle extends Resource {
  resourceType: "Bundle"
  identifier?: Identifier
  entry?: Array<BundleEntry>
  total?: number
  type?: string
  timestamp?: string
}

export interface BundleEntry {
  fullUrl?: string
  resource?: Resource
}

export interface Identifier {
  use?: string
  system?: string
  value?: string
}

export interface MedicationRequestGroupIdentifier extends Identifier {
  extension?: Array<IdentifierExtension>
}

export type RepeatInformationExtension = ExtensionExtension<UnsignedIntExtension | DateTimeExtension>

export type ControlledDrugExtension = ExtensionExtension<StringExtension | CodingExtension>

export type PrescriptionStatusHistoryExtension = ExtensionExtension<CodingExtension>

interface BaseMedicationRequest extends Resource {
  resourceType: "MedicationRequest"
  identifier: Array<Identifier>
  status: string
  intent: string
  medicationCodeableConcept: CodeableConcept
  subject: Reference<Patient>
  authoredOn: string
  requester: Reference<PractitionerRole>
  groupIdentifier: MedicationRequestGroupIdentifier
  dispenseRequest: MedicationRequestDispenseRequest
  substitution?: {
    allowedBoolean: false
  }
}

export interface MedicationRequest extends BaseMedicationRequest {
  category?: Array<CodeableConcept>
  courseOfTherapyType: CodeableConcept
  dosageInstruction: Array<Dosage>
  extension: Array<IdentifierExtension | ReferenceExtension<PractitionerRole> | CodingExtension
    | CodeableConceptExtension | RepeatInformationExtension | ControlledDrugExtension>
  statusReason?: CodeableConcept
}

export interface CodeableConcept {
  coding: Array<Coding>
}

export interface Coding {
  system?: string
  code: string
  display?: string
  version?: string
}

export interface Reference<T extends Resource> {
  reference: string,
  display?: string
}

export interface IdentifierReference<T extends Resource> {
  identifier: Identifier
}

export interface Dosage {
  text: string
  patientInstruction?: string
  additionalInstruction?: Array<CodeableConcept>
}

export interface Performer extends IdentifierReference<Organization> {
  extension?: Array<ReferenceExtension<PractitionerRole>>
}

export interface MedicationRequestDispenseRequest {
  extension?: Array<CodingExtension | StringExtension | ReferenceExtension<PractitionerRole>>
  identifier?: Identifier
  quantity?: SimpleQuantity
  expectedSupplyDuration?: SimpleQuantity
  performer: Performer
  validityPeriod?: Period
}

export interface SimpleQuantity {
  value: string | LosslessNumber
  unit: string
  system?: string
  code: string
}

export interface PatientIdentifier extends Identifier {
  extension: Array<CodeableConceptExtension>
}

export class Patient extends Resource {
  readonly resourceType = "Patient"
  identifier?: Array<PatientIdentifier>
  name?: Array<HumanName>
  telecom?: Array<ContactPoint>
  gender?: string
  birthDate?: string
  address?: Array<Address>
  generalPractitioner?: Array<IdentifierReference<Organization>>
}

export class HumanName {
  use?: string
  family?: string
  given?: Array<string>
  prefix?: Array<string>
  suffix?: Array<string>
  text?: string
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
  name?: string
  telecom?: Array<ContactPoint>
  active?: string
  providedBy?: { identifier: Identifier }
  location?: Array<Reference<Location>>
}

export interface Location extends Resource {
  resourceType: "Location"
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
  expression?: Array<string>
}

export interface OperationOutcome extends Resource {
  resourceType: "OperationOutcome"
  issue: Array<OperationOutcomeIssue>
}

type ParameterTypes = StringParameter | IdentifierParameter | CodeParameter

export class Parameters extends Resource {
  readonly resourceType = "Parameters"
  parameter: Array<ParameterTypes>

  constructor(parameters: Array<ParameterTypes>) {
    super()
    this.parameter = parameters
  }
}

export interface Parameter {
  name: string
}

export interface StringParameter extends Parameter {
  valueString: string
}

interface IdentifierParameter extends Parameter {
  valueIdentifier: Identifier
}

interface CodeParameter extends Parameter {
  valueCode: string
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

export interface ExtensionExtension<T extends Extension> extends Extension {
  extension: Array<T>
}

export interface Signature {
  when: string
  who: Reference<PractitionerRole>
  data: string
}

export class Provenance extends Resource {
  readonly resourceType = "Provenance"
  signature: Array<Signature>
  target: Array<Reference<MedicationRequest>>
}

export interface Period {
  start?: string
  end?: string
}

export interface CommunicationRequest extends Resource {
  resourceType: "CommunicationRequest"
  status?: string
  subject: Reference<Patient>
  payload: Array<ContentStringPayload | ContentReferencePayload>
}

export interface ContentStringPayload {
  contentString: string
}

export interface ContentReferencePayload {
  contentReference: Reference<List>
}

export interface List extends Resource {
  resourceType: "List"
  entry: Array<ListEntry>
}

export interface ListEntry {
  item: {
    display: string
  }
}

interface MessageHeaderSource {
  name?: string
  endpoint: string
}

export interface MessageHeaderDestination {
  endpoint: string
  receiver: IdentifierReference<PractitionerRole | Organization | Practitioner>
}

export interface MessageHeaderResponse {
  identifier: string
  code: "ok" | "transient-error" | "fatal-error"
}

export interface MessageHeader extends Resource {
  resourceType: "MessageHeader"
  eventCoding: Coding
  sender: IdentifierReference<Organization>
  source: MessageHeaderSource
  focus: Array<Reference<Resource>>
  extension?: Array<IdentifierExtension | CodingExtension>
  destination?: Array<MessageHeaderDestination>
  response?: MessageHeaderResponse
}

export interface MedicationRequestOutcome extends BaseMedicationRequest {
  extension: Array<ReferenceExtension<PractitionerRole> | PrescriptionStatusHistoryExtension>
}

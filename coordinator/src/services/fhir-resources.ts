export abstract class Resource {
    id?: string
    resourceType: string
}

export class Bundle extends Resource {
    entry?: Array<BundleEntry>
}

class BundleEntry {
    fullUrl?: string
    resource?: Resource
}

export class Identifier {
    system?: string
    value?: string
}

class MedicationRequestGroupIdentifier extends Identifier {
    extension?: Array<IdentifierExtension>
}

export class MedicationRequest extends Resource {
    identifier?: Array<Identifier>
    category?: Array<CodeableConcept>
    medicationCodeableConcept: CodeableConcept
    subject: Reference<Patient>
    authoredOn?: string
    requester?: Reference<PractitionerRole>
    groupIdentifier?: MedicationRequestGroupIdentifier
    courseOfTherapyType?: CodeableConcept
    dosageInstruction?: Array<Dosage>
    dispenseRequest?: MedicationRequestDispenseRequest
    extension?: Array<Extension>
}

export class CodeableConcept {
    coding: Array<Coding>
}

export class Coding {
    system?: string
    code?: string
    display?: string
    version?: number
}

export class Reference<T extends Resource> {
    reference: string
}

export class Dosage {
    text?: string
}

export class MedicationRequestDispenseRequest {
    quantity?: SimpleQuantity
    performer?: Reference<Organization>
    validityPeriod?: Period
}

export class SimpleQuantity {
    value?: string
    unit?: string
    system?: string
    code?: string
}

export class Patient extends Resource {
    identifier?: Array<Identifier>
    name?: Array<HumanName>
    telecom?: Array<ContactPoint>
    gender?: string
    birthDate?: string
    address?: Array<Address>
    generalPractitioner?: Array<Reference<PractitionerRole>>
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
    practitioner?: Reference<Practitioner>
    organization?: Reference<Organization>
}

export class Practitioner extends Resource {
    identifier?: Array<Identifier>
    name?: Array<HumanName>
    telecom?: Array<ContactPoint>
    address?: Array<Address>
}

export class Organization extends Resource {
    identifier?: Array<Identifier>
    type?: Array<CodeableConcept>
    name?: string
    telecom?: Array<ContactPoint>
    address?: Array<Address>
    partOf?: Reference<Organization>
}

export class OperationOutcomeIssue {
    severity: string
    code: string
    details: CodeableConcept

    constructor(severity: string, code: string, details: CodeableConcept) {
        this.severity = severity
        this.code = code
        this.details = details
    }
}

export class OperationOutcome {
    readonly resourceType = "OperationOutcome"
    issue: Array<OperationOutcomeIssue>
}

export class Parameters {
    readonly resourceType = "Parameters"
    parameter: Array<Parameter>

    constructor(parameters: Array<Parameter>) {
        this.parameter = parameters
    }
}

export class Parameter {
    name: string
    valueString: string
}

export abstract class Extension {
    url: string
}

export class IdentifierExtension extends Extension {
    valueIdentifier: Identifier
}

export class CodingExtension extends Extension {
    valueCoding: Coding
}

export class ReferenceExtension<T extends Resource> extends Extension {
    valueReference: Reference<T>
}

class Signature {
    who: Reference<PractitionerRole>
    data: string
}

export class Provenance extends Resource {
    signature: Array<Signature>
}

export class Period {
    start: string
    end: string
}

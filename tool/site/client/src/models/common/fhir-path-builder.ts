/*
* Fhir Path Builder, used to extract values from FHIR.
* see http://hl7.org/fhirpath/ for the specification
* and https://github.com/HL7/fhirpath.js#readme
* for the latest implementation
*/

export class FhirPathBuilder {
  bundle(): BundlePathBuilder {
    return new BundlePathBuilder("Bundle.entry.resource")
  }
}

class BundlePathBuilder {
    private path: string
    constructor(path: string) {
      this.path = path
    }
    patient(): PatientPathBuilder {
      return new PatientPathBuilder(`${this.path}.ofType(Patient).first()`)
    }
    medicationRequest(): MedicationRequestPathBuilder {
      return new MedicationRequestPathBuilder(`${this.path}.ofType(MedicationRequest).first()`)
    }
    medicationRequests(): MedicationRequestPathBuilder {
      return new MedicationRequestPathBuilder(`${this.path}.ofType(MedicationRequest)`)
    }
}

class MedicationRequestPathBuilder {
    private path: string
    constructor(path: string) {
      this.path = path
    }
    prescriptionId(): string {
      // eslint-disable-next-line max-len
      return `${this.path}.groupIdentifier.extension.where(url = 'https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionId').first().valueIdentifier.value`
    }
    prescriptionShortFormId(): string {
      return `${this.path}.groupIdentifier.value`
    }
    repeatsIssued(): string {
      // eslint-disable-next-line max-len
      return `${this.path}.extension.where(url = 'https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation').extension.where(url = 'numberOfPrescriptionsIssued').valueUnsignedInt`
    }
}

class PatientPathBuilder {
    private path: string
    constructor(path: string) {
      this.path = path
    }
    nhsNumber(): string {
      return `${this.path}.identifier.where(system = 'https://fhir.nhs.uk/Id/nhs-number').value`
    }
}

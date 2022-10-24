import { AbstractPathBuilder } from "./AbstractBuilder"
import { GeneralPractitionerPathBuilder } from "./GeneralPractitioner"

export class PatientPathBuilder extends AbstractPathBuilder {
  constructor(path: string) {
    super(path)
  }

  nhsNumber(): string {
    return `${this.path}.identifier.where(system = 'https://fhir.nhs.uk/Id/nhs-number').value`
  }

  generalPractitioner(): GeneralPractitionerPathBuilder {
    return new GeneralPractitionerPathBuilder(`${this.path}.generalPractitioner`)
  }
}
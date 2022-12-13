import {AbstractPathBuilder} from "./AbstractBuilder"

class PrescriptionPathBuilder extends AbstractPathBuilder {
  constructor(path: string) {
    super(path)
  }

  shortFormId(): string {
    return `${this.path}.valueIdentifier.where(system = 'https://fhir.nhs.uk/Id/prescription-order-number').value`
  }
}

class PharmacyPathBuilder extends AbstractPathBuilder {
  constructor(path: string) {
    super(path)
  }

  odsCode(): string {
    return `${this.path}.identifier.where(system = 'https://fhir.nhs.uk/Id/ods-organization-code').value`
  }
}

export class ParametersPathBuilder extends AbstractPathBuilder {
  constructor(path: string) {
    super(path)
  }

  owner(): PharmacyPathBuilder {
    return new PharmacyPathBuilder(`${this.path}.parameter.where(name = 'owner').resource`)
  }

  prescription(): PrescriptionPathBuilder {
    return new PrescriptionPathBuilder(`${this.path}.parameter.where(name = 'group-identifier')`)
  }
}

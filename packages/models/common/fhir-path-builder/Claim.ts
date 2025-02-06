import {AbstractPathBuilder} from "./AbstractBuilder"
import {PatientPathBuilder} from "./Patient"

class PrescriptionPathBuilder extends AbstractPathBuilder {
  constructor(path: string) {
    super(path)
  }

  shortFormId(): string {
    const extension = `${this.path}.extension.extension`
    const valuePath = "valueIdentifier.where(system = 'https://fhir.nhs.uk/Id/prescription-order-number').value"
    return `${extension}.${valuePath}`
  }
}

class OrganizationPathBuilder extends AbstractPathBuilder {
  constructor(path: string) {
    super(path)
  }

  odsCode(): string {
    return `${this.path}.identifier.where(system = 'https://fhir.nhs.uk/Id/ods-organization-code').value`
  }
}

class ClaimPathBuilder extends AbstractPathBuilder {
  constructor(path: string) {
    super(path)
  }

  identifier(): string {
    return `${this.path}.identifier.value`
  }

  patient(): PatientPathBuilder {
    return new PatientPathBuilder(`${this.path}.patient`)
  }

  prescription(): PrescriptionPathBuilder {
    return new PrescriptionPathBuilder(`${this.path}.prescription`)
  }

  organization(): OrganizationPathBuilder {
    return new OrganizationPathBuilder(`${this.path}.contained.where(resourceType = 'Organization')`)
  }
}

export {ClaimPathBuilder, PrescriptionPathBuilder}

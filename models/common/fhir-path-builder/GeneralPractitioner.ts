import { AbstractPathBuilder } from "./AbstractBuilder"

export class GeneralPractitionerPathBuilder extends AbstractPathBuilder {
  constructor(path: string) {
    super(path)
  }

  odsOrganizationCode(): string {
    return `${this.path}.identifier.where(system = 'https://fhir.nhs.uk/Id/ods-organization-code').value`
  }
}

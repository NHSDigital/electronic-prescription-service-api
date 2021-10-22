import * as fhirExtension from "../../models/extension"

export function getLongFormIdExtension(extensions: Array<fhirExtension.IdentifierExtension>): fhirExtension.IdentifierExtension {
  return extensions.filter(function (extension) {
    return (
      extension.url ===
      "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionId"
    )
  })[0]
}

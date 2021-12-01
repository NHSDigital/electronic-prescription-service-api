import {Extension} from "fhir/r4"

export function getLongFormIdExtension(extensions: Array<Extension>): Extension {
  return extensions.filter(function (extension) {
    return (
      extension.url ===
      "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionId"
    )
  })[0]
}

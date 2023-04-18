import {applyFhirPath} from "../../../src/services/validation/fhir-path"
import * as TestResources from "../../resources/test-resources"
import {getMedicationRequests} from "../../../src/services/translation/common/getResourcesOfType"
import {fhir} from "@models"

describe("applyFhirPath returns correct value", () => {
  const bundle = TestResources.specification[0].fhirMessageSigned
  const medicationRequests = getMedicationRequests(bundle)

  test("when path contains ofType()", () => {
    const patients = applyFhirPath(bundle, [bundle], "entry.resource.ofType(Patient)") as Array<fhir.Patient>
    expect(patients.length).toBe(1)
    expect(patients[0].resourceType).toBe("Patient")
  })

  test("when path contains resolve()", () => {
    const requesters = applyFhirPath(bundle, medicationRequests, "requester.resolve()") as Array<fhir.PractitionerRole>
    expect(requesters.length).toBe(medicationRequests.length)
    requesters.forEach((requester) => expect(requester.resourceType).toBe("PractitionerRole"))
  })

  test("when path contains extension()", () => {
    const extensions = applyFhirPath(
      bundle,
      medicationRequests,
      'dispenseRequest.extension("https://fhir.nhs.uk/StructureDefinition/Extension-DM-PerformerSiteType")'
    ) as Array<fhir.Extension>
    expect(extensions.length).toBe(medicationRequests.length)
    extensions.forEach((extension) =>
      expect(extension.url).toBe("https://fhir.nhs.uk/StructureDefinition/Extension-DM-PerformerSiteType")
    )
  })
})

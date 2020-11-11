import {applyFhirPath} from "../../../src/services/validation/fhir-path"
import * as TestResources from "../../resources/test-resources"
import {Extension, Patient, PractitionerRole} from "../../../src/models/fhir/fhir-resources"
import {getMedicationRequests} from "../../../src/services/translation/common/getResourcesOfType"

describe("applyFhirPath returns correct value", () => {
  const bundle = TestResources.examplePrescription1.fhirMessageSigned
  const medicationRequests = getMedicationRequests(bundle)

  test("when path contains ofType()", () => {
    const patients = applyFhirPath(
      bundle,
      [bundle],
      "entry.resource.ofType(Patient)"
    ) as Array<Patient>
    expect(patients.length).toBe(1)
    expect(patients[0].resourceType).toBe("Patient")
  })

  test("when path contains resolve()", () => {
    const requesters = applyFhirPath(
      bundle,
      medicationRequests,
      "requester.resolve()"
    ) as Array<PractitionerRole>
    expect(requesters.length).toBe(medicationRequests.length)
    requesters.map(requester => expect(requester.resourceType).toBe("PractitionerRole"))
  })

  test("when path contains extension()", () => {
    const extensions = applyFhirPath(
      bundle,
      medicationRequests,
      "dispenseRequest.extension(\"https://fhir.nhs.uk/R4/StructureDefinition/Extension-performerSiteType\")"
    ) as Array<Extension>
    expect(extensions.length).toBe(medicationRequests.length)
    extensions.map(
      extension =>
        expect(extension.url).toBe("https://fhir.nhs.uk/R4/StructureDefinition/Extension-performerSiteType")
    )
  })
})

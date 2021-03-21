import * as TestResources from "../../../../resources/test-resources"
import {getExtensionForUrlOrNull} from "../../../../../src/services/translation/common"
import {
  createMedicationRequest
} from "../../../../../src/services/translation/response/cancellation/cancellation-medication-request"
import {getCancellationResponse, hasCorrectISOFormat} from "../../common/test-helpers"
import {fhir} from "../../../../../../models/library"

describe("createMedicationRequest", () => {
  const cancellationResponse = getCancellationResponse(TestResources.spineResponses.cancellationError)
  const responsiblePartyPractitionerRoleId = "test"
  const patientId = "testPatientId"
  const authorPrescriptionRoleId = "testAuthorRoleId"
  const medicationRequest = createMedicationRequest(
    cancellationResponse,
    responsiblePartyPractitionerRoleId,
    patientId,
    authorPrescriptionRoleId)

  test("has extensions", () => {
    expect(medicationRequest.extension).not.toBeUndefined()
  })

  test("contains status-history extension with correct code and display", () => {
    const extension = getExtensionForUrlOrNull(
      medicationRequest.extension,
      "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionTaskStatusReason",
      "MedicationRequest.extension"
    ) as fhir.ExtensionExtension<fhir.CodeableConceptExtension>
    expect(extension).not.toBeUndefined()
    const medicationStatusHistoryExtension = getExtensionForUrlOrNull(
      extension.extension,
      "status",
      "") as fhir.CodingExtension
    expect(medicationStatusHistoryExtension).not.toBeUndefined()
    const valueCoding = medicationStatusHistoryExtension.valueCoding
    expect(valueCoding.system).toBe("https://fhir.nhs.uk/CodeSystem/medicationrequest-status-history")
    expect(valueCoding.code).toBe("R-0008")
    expect(valueCoding.display).toBe("Prescription/item not found")
  })

  test("contains ResponsiblePractitioner extension with correct reference", () => {
    const extension = getExtensionForUrlOrNull(
      medicationRequest.extension,
      "https://fhir.nhs.uk/StructureDefinition/Extension-DM-ResponsiblePractitioner",
      "MedicationRequest.extension"
    ) as fhir.ReferenceExtension<fhir.PractitionerRole>
    expect(extension).not.toBeUndefined()
    const reference = extension.valueReference.reference
    expect(reference).toBe(`urn:uuid:${responsiblePartyPractitionerRoleId}`)
  })

  test("has identifier", () => {
    const identifier = medicationRequest.identifier
    expect(identifier).toHaveLength(1)
    expect(identifier[0].system).toBe("https://fhir.nhs.uk/Id/prescription-order-item-number")
    expect(identifier[0].value).toBe("a54219b8-f741-4c47-b662-e4f8dfa49ab6")
  })

  test("has 'order' in `intent` key", () => {
    const intent = medicationRequest.intent
    expect(intent).toBe(fhir.MedicationRequestIntent.ORDER)
  })

  test("has default medication in medicationCodeableConcept", () => {
    expect(medicationRequest.medicationCodeableConcept).toEqual(
      {
        "coding":
          [
            {
              "code": "763158003",
              "system": "http://snomed.info/sct",
              "display": "Medicinal product"
            }
          ]
      }
    )
  })

  test("subject", () => {
    const subject = medicationRequest.subject
    expect(subject.reference).toBe(`urn:uuid:${patientId}`)
  })

  test("authoredOn", () => {
    expect(hasCorrectISOFormat(medicationRequest.authoredOn)).toBe(true)
  })

  test("requester", () => {
    const requester = medicationRequest.requester
    expect(requester.reference).toBe(`urn:uuid:${authorPrescriptionRoleId}`)
  })

  test("groupIdentifier", () => {
    const groupIdentifier = medicationRequest.groupIdentifier
    expect(groupIdentifier.system).toBe("https://fhir.nhs.uk/Id/prescription-order-number")
    expect(groupIdentifier.value).toBe("DA923E-Z8827F-11EBAK")
  })

  test("dispenseRequest", () => {
    expect(medicationRequest.dispenseRequest).toBeFalsy()
  })
})

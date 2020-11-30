import * as TestResources from "../../../resources/test-resources"
import {
  getExtensionForUrlOrNull,
  SPINE_CANCELLATION_ERROR_RESPONSE_REGEX
} from "../../../../src/services/translation/common"
import * as fhir from "../../../../src/models/fhir/fhir-resources"
import {
  createMedicationRequest
} from "../../../../src/services/translation/cancellation/cancellation-medication-conversion"
import {readXml} from "../../../../src/services/serialisation/xml"
import {generateFullUrl} from "../../../../src/services/translation/cancellation/common"

describe("createMedicationRequest", () => {
  const actualError = TestResources.spineResponses.cancellationError
  const cancelResponse = SPINE_CANCELLATION_ERROR_RESPONSE_REGEX.exec(actualError.response.body)[0]
  const parsedMsg = readXml(cancelResponse)
  const actEvent = parsedMsg["hl7:PORX_IN050101UK31"]["hl7:ControlActEvent"]
  const cancellationResponse = actEvent["hl7:subject"].CancellationResponse
  const practitionerRoleId = "testRoleId"
  const patientId = "testPatientId"
  const medicationRequest = createMedicationRequest(cancellationResponse, practitionerRoleId, patientId)

  test("has extensions", () => {
    expect(medicationRequest.extension).not.toBeUndefined()
  })

  test("contains status-history extension with correct code and display", () => {
    const extension = getExtensionForUrlOrNull(
      medicationRequest.extension,
      "https://fhir.nhs.uk/R4/StructureDefinition/Extension-DM-PrescriptionStatusHistory",
      "MedicationRequest.extension"
    ) as fhir.ExtensionExtension
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
      "https://fhir.nhs.uk/R4/StructureDefinition/Extension-DM-ResponsiblePractitioner",
      "MedicationRequest.extension"
    ) as fhir.ReferenceExtension<fhir.PractitionerRole>
    expect(extension).not.toBeUndefined()
    const reference = extension.valueReference.reference
    expect(reference).toBe(generateFullUrl(practitionerRoleId))
  })

  test("has identifier", () => {
    const identifier = medicationRequest.identifier
    expect(identifier).toHaveLength(1)
    expect(identifier[0].system).toBe("a54219b8-f741-4c47-b662-e4f8dfa49ab6")
    expect(identifier[0].value).toBe("https://fhir.nhs.uk/Id/prescription-order-item-number")
  })

  test("has 'order' in `intent` key", () => {
    const intent = medicationRequest.intent
    expect(intent).toBe("order")
  })

  test("has default medication in medicationCodeableConcept", () => {
    expect(medicationRequest.medicationCodeableConcept).toEqual(
      {
        "coding":
          [
            {"code": "763158003",
              "system": "http://snomed.info/sct",
              "display": "Medicinal product"
            }
          ]
      }
    )
  })

  test("subject", () => {
    const subject = medicationRequest.subject
    expect(subject.reference).toBe(patientId)
  })

  test("authoredOn", () => {
    expect(medicationRequest.authoredOn).toBe("2020-11-18T09:25:23+00:00")
  })
})

import * as fhir from "../../../models/fhir/fhir-resources"
import {readXml} from "../../serialisation/xml"
import {createMedicationRequest} from "./cancellation-medication-conversion"
import {SpineCancellationResponse} from "../../../models/hl7-v3/hl7-v3-spine-response"
import {createPatient} from "./cancellation-patient"

export function translateSpineCancelResponseIntoBundle(message: string): fhir.Bundle {
  const parsedMsg = readXml(message) as SpineCancellationResponse
  const bundle = new fhir.Bundle()
  const bundleElements = [
    createMedicationRequest(parsedMsg),
    createPatient(parsedMsg)
  ]
  bundle.entry = bundleElements.map(resource => ({fullUrl: "123456789", resource}))
  bundle.type = "message"
  return bundle
}

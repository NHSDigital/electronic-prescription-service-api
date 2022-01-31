import {
  MessageHeader,
  MedicationRequest,
  Resource,
  Bundle,
  FhirResource
} from "fhir/r4"

export const getMessageHeaderResources = buildResourceFinder<MessageHeader>("MessageHeader")
export const getMedicationRequestResources = buildResourceFinder<MedicationRequest>("MedicationRequest")

function buildResourceFinder<T extends FhirResource>(resourceType: string): (payload: Bundle) => Array<T> {
  return function (payload: Bundle): Array<T> {
    const typeCheck = (resource: Resource): resource is T => resource.resourceType === resourceType

    const resources = payload.entry.map(function (entry) {
      return entry.resource
    })
    return resources.filter(typeCheck)
  }
}

export function isRepeatDispensing(bundle: Bundle): boolean {
  return getMedicationRequestResources(bundle)
    .flatMap(medicationRequest => medicationRequest.courseOfTherapyType.coding)
    .some(coding => coding.code === "continuous-repeat-dispensing")
}

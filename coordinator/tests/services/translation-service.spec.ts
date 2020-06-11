import * as translationService from "../../src/services/translation-service"
import bundle from "../resources/fhir-bundle"
import {Resource} from "../../src/services/fhir-resources";

test('getResourcesOfType returns correct resources', () => {
    const result = translationService.getResourcesOfType(bundle, "MedicationRequest")
    expect(result).toBeInstanceOf(Array)
    expect(result).toHaveLength(4)
    result.map(x => expect((x as Resource).resourceType).toBe("MedicationRequest"))
})

import * as translator from "./translation-service";
import {SpineResponse, sendData} from "./spine-communication"
import {Bundle, OperationOutcome} from "./fhir-resources";
import {ValidationError} from "../validators/request-validator";

export function createPrescription(validation: Array<ValidationError>, requestPayload: unknown): OperationOutcome | string {
    if (validation.length > 0) {
        return FhirError(validation)
    }
    return translator.convertFhirMessageToHl7V3ParentPrescription(requestPayload as Bundle)
}

export function createSignedInfo(validation: Array<ValidationError>, requestPayload: unknown): OperationOutcome | string {
    if (validation.length > 0) {
        return FhirError(validation)
    }
    return translator.convertFhirMessageToHl7V3SignedInfo(requestPayload as Bundle)
}

export function sendMessage(validation: Array<ValidationError>, requestPayload: unknown): Promise<SpineResponse> {
    if (validation.length > 0) {
        return Promise.resolve({body: JSON.stringify(FhirError(validation)), statusCode: 400})
    }
    return sendData(JSON.stringify(requestPayload))
}

function FhirError(validation: Array<ValidationError>): OperationOutcome {
    /* Reformat errors to FHIR spec
      * v.operationOutcomeCode: from the [IssueType ValueSet](https://www.hl7.org/fhir/valueset-issue-type.html)
      * v.apiErrorCode: Our own code defined for each particular error. Refer to OAS.
    */
    return {
        resourceType: "OperationOutcome",
        issue: validation.map(v => {
            return {
                severity: v.severity,
                code: v.operationOutcomeCode,
                details: {
                    coding: [{
                        system: "https://fhir.nhs.uk/R4/CodeSystem/Spine-ErrorOrWarningCode",
                        version: 1,
                        code: v.apiErrorCode,
                        display: v.message
                    }]
                }
            }
        })
    }
}

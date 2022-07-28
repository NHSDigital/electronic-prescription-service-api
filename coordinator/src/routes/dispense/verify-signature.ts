import Hapi from "@hapi/hapi"
import {
  BASE_PATH,
  ContentTypes,
  externalValidator,
  getPayload
} from "../util"
import {fhir, spine, validationErrors as errors} from "@models"
import {spineClient} from "../../services/communication/spine-client"
import {getRequestId} from "../../utils/headers"
import {extractHl7v3PrescriptionFromMessage} from "../../services/communication/tracker/tracker-response-parser"
import {isBundle} from "../../utils/type-guards"
import {getMedicationRequests} from "../../services/translation/common/getResourcesOfType"
import {verifySignature} from "../../services/signature-verification"
import {buildVerificationResultParameter} from "../../utils/build-verification-result-parameter"

// todo:
// 1. Remove VerifySignatureTemp payload - DONE
// 2. Ensure endpoint accepts the following types of payload:
//  2a. bulk release response - DONE
//  2b. single release response
//  2c. parent prescription
// 3. Re-instate external validator - DONE
// 4. Extract prescription id(s)/repeat-numbers from request - DONE
// 5. Use extracted prescription id(s) to track hl7v3 prescription(s) - DONE
// 6. Verify digest, signature for each prescription - DONE
// 7. Return parameters result as before - DONE
// 8. Test cases
//  8a. HL7v3 Acute/Repeat Prescribing/Repeat Dispensing prescriptions
//  8b. FHIR Acute/Repeat Prescribing/Repeat Dispensing prescriptions
//  8c. No prescription in tracker for prescription id(s) in request
// 9. Error handling for no prescription found in tracker
// 10. Update smoke-tests

export default [
  /*
      Verify prescription signatures.
    */
  {
    method: "POST",
    path: `${BASE_PATH}/$verify-signature`,
    handler: externalValidator(
      async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
        const messageId = getRequestId(request.headers)

        const outerBundle = getPayload(request) as fhir.Resource
        if (!isBundle(outerBundle)) {
          const operationOutcome = fhir.createOperationOutcome([
            errors.createResourceTypeIssue("Bundle")
          ])
          return responseToolkit.response(operationOutcome).code(400).type(ContentTypes.FHIR)
        }

        request.logger.info("Verifying prescription signatures")

        const response = await Promise.all(outerBundle.entry.map(async(entry: fhir.BundleEntry, index: number) => {
          const fhirPrescriptionFromRequest = entry.resource as fhir.Bundle
          const firstMedicationRequest = getMedicationRequests(fhirPrescriptionFromRequest)[0]
          const prescriptionId = firstMedicationRequest.groupIdentifier.value
          const ukCoreRepeatsIssuedExtension = getUkCoreNumberOfRepeatsIssuedExtension(firstMedicationRequest.extension)
          // todo: confirm if repeatNumbers are non-zero-indexed in spine tracker
          const currentIssueNumber = (
            ukCoreRepeatsIssuedExtension ? ukCoreRepeatsIssuedExtension.valueUnsignedInt : 0
          ) + 1
          const trackerRequest = spine.buildPrescriptionMetadataRequest(
            messageId,
            prescriptionId,
            currentIssueNumber.toString()
          )
          const trackerResponse = await spineClient.track(trackerRequest, request.logger)
          const hl7v3PrescriptionFromTracker = extractHl7v3PrescriptionFromMessage(trackerResponse.body, request.logger)
          const errors = verifySignature(hl7v3PrescriptionFromTracker)
          const partialResponse = createFhirPartialResponse(index, fhirPrescriptionFromRequest, errors)
          return {partialResponse}
        }))

        return responseToolkit.response(...response).code(200).type(ContentTypes.FHIR)
      }
    )
  }
]

function createFhirPartialResponse(
  index: number,
  prescription: fhir.Bundle,
  errors: Array<string>
): fhir.MultiPartParameter {
  if (errors.length) {
    const issue = errors.map(e => createInvalidSignatureIssue(e))
    return buildVerificationResultParameter(prescription, issue, index)
  }

  const issue: Array<fhir.OperationOutcomeIssue> = [{
    severity: "information",
    code: fhir.IssueCodes.INFORMATIONAL
  }]
  return buildVerificationResultParameter(prescription, issue, index)
}

function createInvalidSignatureIssue(display: string): fhir.OperationOutcomeIssue {
  return {
    severity: "error",
    code: fhir.IssueCodes.INVALID,
    details: {
      coding: [{
        system: "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode",
        code: "INVALID",
        display
      }]
    },
    expression: ["Provenance.signature.data"]
  }
}

// V todo: move all below to common V

// eslint-disable-next-line max-len
export const URL_UK_CORE_REPEAT_INFORMATION = "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation"
export const URL_UK_CORE_NUMBER_OF_PRESCRIPTIONS_ISSUED = "numberOfPrescriptionsIssued"

export interface UkCoreNumberOfRepeatPrescriptionsIssuedExtension extends fhir.Extension {
  url: typeof URL_UK_CORE_NUMBER_OF_PRESCRIPTIONS_ISSUED
  valueUnsignedInt: number
}

export const getUkCoreNumberOfRepeatsIssuedExtension = (extensions: Array<fhir.Extension>)
  : UkCoreNumberOfRepeatPrescriptionsIssuedExtension =>
    getExtensions(extensions, [
      URL_UK_CORE_REPEAT_INFORMATION,
      URL_UK_CORE_NUMBER_OF_PRESCRIPTIONS_ISSUED
    ])[0] as UkCoreNumberOfRepeatPrescriptionsIssuedExtension

function getExtensions<T extends fhir.Extension>(
  extensions: Array<fhir.Extension>,
  urls: Array<string>
): Array<T> {
  const nextUrl = urls.shift()
  const extensionsForUrl = extensions.filter(extension => extension.url === nextUrl)
  if (!urls.length) {
    return extensionsForUrl as Array<T>
  }
  const nestedExtensions = extensionsForUrl.flatMap(extension => extension?.extension || [])
  return getExtensions(nestedExtensions, urls)
}

import Hapi from "@hapi/hapi"
import {
  BASE_PATH,
  ContentTypes,
  externalValidator,
  getPayload
} from "../util"
import {fhir, validationErrors as errors} from "@models"
import {getRequestId} from "../../utils/headers"
import {isBundle} from "../../utils/type-guards"
import {getMedicationRequests} from "../../services/translation/common/getResourcesOfType"
import {buildVerificationResultParameter} from "../../utils/build-verification-result-parameter"
import {trackerClient} from "../../services/communication/tracker/tracker-client"
import {getLogger} from "../../services/logging/logger"
import {verifySignature} from "../../services/signature-verification"

// todo:
// 1. Remove VerifySignatureTemp payload - DONE
// 2. Ensure endpoint accepts the following types of payload:
//  2a. release response - DONE
//  2b. parent prescription - DONE
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
  {
    method: "POST",
    path: `${BASE_PATH}/$verify-signature`,
    handler: externalValidator(
      async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {

        const bundle = getPayload(request) as fhir.Resource
        if (!isBundle(bundle)) {
          const operationOutcome = fhir.createOperationOutcome([
            errors.createResourceTypeIssue("Bundle")
          ])
          return responseToolkit.response(operationOutcome).code(400).type(ContentTypes.FHIR)
        }

        const prescriptions = bundle.entry.some(entry => isBundle(entry.resource))
          ? bundle.entry
            .map(entry => entry.resource)
            .filter(isBundle)
          : [bundle]

        request.logger.info("Verifying prescription signatures")

        const parameters = await Promise.all(
          prescriptions.map(async(fhirPrescriptionFromRequest: fhir.Bundle, index: number) => {
            const firstMedicationRequest = getMedicationRequests(fhirPrescriptionFromRequest)[0]
            const prescriptionId = firstMedicationRequest.groupIdentifier.value
            const ukCoreRepeatsIssuedExtension = getUkCoreNumberOfRepeatsIssuedExtension(
              firstMedicationRequest.extension
            )
            // todo: confirm if repeatNumbers are non-zero-indexed in spine tracker
            const currentIssueNumber = (
              ukCoreRepeatsIssuedExtension ? ukCoreRepeatsIssuedExtension.valueUnsignedInt : 0
            ) + 1
            const logger = getLogger(request.logger)
            const trackerResponse = await trackerClient.track(
              getRequestId(request.headers),
              prescriptionId,
              currentIssueNumber.toString(),
              logger
            )
            // todo: handle errors inc. no prescription returned
            const hl7v3PrescriptionFromTracker = trackerResponse.prescription
            const errors = verifySignature(hl7v3PrescriptionFromTracker)
            return createFhirMultiPartParameter(index, fhirPrescriptionFromRequest, errors)
          })
        )

        const response: fhir.Parameters = {
          resourceType: "Parameters",
          parameter: parameters
        }

        return responseToolkit.response(response).code(200).type(ContentTypes.FHIR)
      }
    )
  }
]

function createFhirMultiPartParameter(
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

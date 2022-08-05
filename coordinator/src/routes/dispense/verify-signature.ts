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
import {verifySignature} from "../../services/signature-verification"
import {buildVerificationResultParameter} from "../../utils/build-verification-result-parameter"
import {trackerClient} from "../../services/communication/tracker/tracker-client"
import {toArray} from "../../services/translation/common"

// todo:
// 1. Test cases
//  1a. HL7v3 Acute/Repeat Prescribing/Repeat Dispensing prescriptions
//  1b. FHIR Acute/Repeat Prescribing/Repeat Dispensing prescriptions
//  1c. No prescription in tracker for prescription id(s) in request
// 2. Error handling for no prescription found in tracker

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

        const prescriptions = isReleaseResponse(bundle)
          ? getBundlesFromReleaseResponse(bundle)
          : isBundle(bundle)
            ? toArray(bundle)
            : null

        if (prescriptions === null) {
          request.logger.error("Did not receive a release response or FHIR bundle prescription")
          // todo: return error response
        }

        request.logger.info("Verifying prescription signatures")

        const parameters = await Promise.all(
          prescriptions.map(async(fhirPrescriptionFromRequest: fhir.Bundle, index: number) => {
            const firstMedicationRequest = getMedicationRequests(fhirPrescriptionFromRequest)[0]
            const prescriptionId = firstMedicationRequest.groupIdentifier.value
            const ukCoreRepeatsIssuedExtension = getUkCoreNumberOfRepeatsIssuedExtension(
              firstMedicationRequest.extension
            )
            const currentIssueNumber = (
              ukCoreRepeatsIssuedExtension ? ukCoreRepeatsIssuedExtension.valueUnsignedInt : 0
            ) + 1
            const trackerResponse = await trackerClient.track(
              getRequestId(request.headers),
              prescriptionId,
              currentIssueNumber.toString(),
              request.logger
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

function getBundlesFromReleaseResponse(bundle: fhir.Bundle) {
  return bundle.entry
    .map(entry => entry.resource)
    .filter(isBundle)
}

function isReleaseResponse(bundle: fhir.Bundle) {
  return bundle.entry.some(entry => isBundle(entry.resource))
}

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

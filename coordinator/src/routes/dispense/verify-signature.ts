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
import {createBundle} from "../../services/translation/common/response-bundles"
import {getExtensionForUrl} from "../../services/translation/common"

export default [
  {
    method: "POST",
    path: `${BASE_PATH}/$verify-signature`,
    handler: externalValidator(
      async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
        const messageId = getRequestId(request.headers)

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
            const trackerRequest = spine.buildPrescriptionMetadataRequest(
              messageId,
              prescriptionId,
              currentIssueNumber.toString()
            )
            const trackerResponse = await spineClient.track(trackerRequest, request.logger)
            const hl7v3PrescriptionFromTracker = extractHl7v3PrescriptionFromMessage(
              trackerResponse.body,
              request.logger
            )
            const fhirPrescriptionTranslatedFromhl7v3 = createBundle(hl7v3PrescriptionFromTracker, "")
            const errors = [
              ...verifySignature(hl7v3PrescriptionFromTracker),
              ...comparePrescriptions(
                fhirPrescriptionFromRequest,
                fhirPrescriptionTranslatedFromhl7v3
              )
            ]
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

function comparePrescriptions(
  prescription1: fhir.Bundle,
  prescription2: fhir.Bundle
): Array<string> {
  const errors = []

  const firstMedicationRequest1 = getMedicationRequests(prescription1)[0]
  const firstMedicationRequest2 = getMedicationRequests(prescription2)[0]
  const prescriptionIds1 = extractPrescriptionIds(firstMedicationRequest1)
  const prescriptionIds2 = extractPrescriptionIds(firstMedicationRequest2)
  const prescriptionIdsMatch = prescriptionIds1 === prescriptionIds2
  if (!prescriptionIdsMatch) {
    errors.push("Prescription Ids do not match")
  }

  return errors
}

function extractPrescriptionIds(
  firstMedicationRequest1: fhir.MedicationRequest
) {
  const groupIdentifier = firstMedicationRequest1.groupIdentifier
  const prescriptionIdExtension = getExtensionForUrl(
    groupIdentifier.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionId",
    "MedicationRequest.groupIdentifier.extension"
  ) as fhir.IdentifierExtension
  const prescriptionId = prescriptionIdExtension.valueIdentifier.value
  const prescriptionShortFormId = groupIdentifier.value
  return [prescriptionId, prescriptionShortFormId]
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

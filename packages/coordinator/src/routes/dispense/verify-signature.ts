import Hapi from "@hapi/hapi"
import pino from "pino"
import {
  BASE_PATH,
  ContentTypes,
  externalValidator,
  getPayload
} from "../util"
import {createHash} from "../create-hash"
import {fhir, validationErrors as errors, common} from "@models"
import {getRequestId} from "../../utils/headers"
import {isBundle} from "../../utils/type-guards"
import {verifyPrescriptionSignature, comparePrescriptions} from "../../services/verification"
import {buildVerificationResultParameter} from "../../utils/build-verification-result-parameter"
import {trackerClient} from "../../services/communication/tracker/tracker-client"
import {toArray} from "../../services/translation/common"
import {createBundle} from "../../services/translation/common/response-bundles"
import {HashingAlgorithm} from "../../services/translation/common/hashingAlgorithm"

// todo:
// 1. Test cases
//  1a. HL7v3 Acute/Repeat Prescribing/Repeat Dispensing prescriptions
//  1b. FHIR Acute/Repeat Prescribing/Repeat Dispensing prescriptions
//  1c. No prescription in tracker for prescription id(s) in request
// 2. Error handling for no prescription found in tracker

const verifyPrescription = async (
  fhirPrescriptionFromRequest: fhir.Bundle,
  requestId: string,
  logger: pino.Logger
): Promise<Array<string>> => {
  const fhirPathBuilder = new common.FhirPathBuilder()
  const fhirPathReader = new common.FhirPathReader(fhirPrescriptionFromRequest)
  const medicationRequest = fhirPathBuilder.bundle().medicationRequest()
  const prescriptionId = fhirPathReader.read(medicationRequest.prescriptionShortFormId())
  const repeatNumber = getRepeatNumber(fhirPathReader.read(medicationRequest.repeatsIssued()))
  const trackerResponse = await trackerClient.track(requestId, prescriptionId, repeatNumber, logger)
  // todo: handle errors inc. no prescription returned
  const hl7v3PrescriptionFromTracker = trackerResponse.prescription
  const fhirPrescriptionTranslatedFromHl7v3 = await createBundle(hl7v3PrescriptionFromTracker, "")
  const prescriptionFromTracker = common.buildPrescription(fhirPrescriptionTranslatedFromHl7v3)
  const prescriptionFromRequest = common.buildPrescription(fhirPrescriptionFromRequest)

  const signatureVerificationErrors = await verifyPrescriptionSignature(hl7v3PrescriptionFromTracker, logger)
  const errors = [
    ...signatureVerificationErrors,
    ...comparePrescriptions(prescriptionFromTracker, prescriptionFromRequest)
  ]
  if (errors.length) {
    logVerificationErrors(logger, prescriptionId, errors)
  }
  return errors
}

const createVerificationResponse = async (
  fhirPrescriptionFromRequest: Array<fhir.Bundle>,
  requestId: string,
  logger: pino.Logger
): Promise<Array<fhir.MultiPartParameter>> => {
  const parameters = await Promise.all(
    fhirPrescriptionFromRequest.map(async (prescription: fhir.Bundle, index: number) => {
      const verificationErrors = await verifyPrescription(prescription, requestId, logger)
      return createFhirMultiPartParameter(index, prescription, verificationErrors)
    })
  )
  return parameters
}

const getPrescriptionsFromPayload = (payload: fhir.Resource, logger: pino.Logger): Array<fhir.Bundle> => {
  if (!isBundle(payload)) {
    logger.error("Did not receive a release response or FHIR bundle prescription")
    return null
  }

  // We return an array of bundles, whether we received a release response or not,
  // so that we can handle both objects in the same way.
  return isReleaseResponse(payload) ? getBundlesFromReleaseResponse(payload) : toArray(payload)
}

function logVerificationErrors(logger: pino.Logger, prescriptionId: string, errors: Array<string>): void {
  const logMessage = `[Verifying signature for prescription ID ${prescriptionId}]: `
  const errorsAndMessage = logMessage + errors.join(", ")
  logger.error(errorsAndMessage)
}

export default [
  {
    method: "POST",
    path: `${BASE_PATH}/$verify-signature`,
    handler: externalValidator(
      async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
        const logger = request.logger
        const payload = getPayload(request) as fhir.Resource
        request.log("audit", {incomingMessageHash: createHash(JSON.stringify(payload), HashingAlgorithm.SHA256)})

        const prescriptions = getPrescriptionsFromPayload(payload, logger)
        if (prescriptions === null) {
          const operationOutcome = fhir.createOperationOutcome(
            [errors.createResourceTypeIssue("Bundle")],
            payload.meta?.lastUpdated
          )
          return responseToolkit.response(operationOutcome).code(400).type(ContentTypes.FHIR)
        }

        logger.info("Verifying prescription(s)")
        const requestId = getRequestId(request.headers)
        const parameters = await createVerificationResponse(prescriptions, requestId, logger)

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
  return bundle.entry.map((entry) => entry.resource).filter(isBundle)
}

function isReleaseResponse(bundle: fhir.Bundle) {
  return bundle.entry.some((entry) => isBundle(entry.resource))
}

function createFhirMultiPartParameter(
  index: number,
  prescription: fhir.Bundle,
  errors: Array<string>
): fhir.MultiPartParameter {
  if (errors.length) {
    const issue = errors.map((e) => createInvalidSignatureIssue(e))
    return buildVerificationResultParameter(prescription, issue, index)
  }
  const issue: Array<fhir.OperationOutcomeIssue> = [
    {
      severity: "information",
      code: fhir.IssueCodes.INFORMATIONAL
    }
  ]
  return buildVerificationResultParameter(prescription, issue, index)
}
function createInvalidSignatureIssue(display: string): fhir.OperationOutcomeIssue {
  return {
    severity: "error",
    code: fhir.IssueCodes.INVALID,
    details: {
      coding: [
        {
          system: "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode",
          code: "INVALID",
          display
        }
      ]
    },
    expression: ["Provenance.signature.data"]
  }
}

function getRepeatNumber(repeatsIssued: string) {
  const valueOrDefault = repeatsIssued ? parseInt(repeatsIssued) : 0
  return (valueOrDefault + 1).toString()
}

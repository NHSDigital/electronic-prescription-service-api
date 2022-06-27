import Hapi from "@hapi/hapi"
import {
  BASE_PATH,
  ContentTypes,
  externalValidator,
  getPayload
} from "../util"
import {fhir, hl7V3, validationErrors as errors} from "@models"
import {isBundle} from "../../utils/type-guards"
import {convertParentPrescription} from "../../services/translation/request/prescribe/parent-prescription"
import {
  verifyPrescriptionSignatureValid,
  verifySignatureHasCorrectFormat,
  verifySignatureDigestMatchesPrescription
} from "../../services/signature-verification"
import pino from "pino"
import {buildVerificationResultParameter} from "../../utils/build-verification-result-parameter"
import {trackerClient} from "../../services/communication/tracker"
import {getMedicationRequests} from "../../services/translation/common/getResourcesOfType"
import {convertHL7V3DateTimeToIsoDateTimeString} from "../../services/translation/common/dateTime"

export default [
  /*
      Verify prescription bundle signatures.
    */
  {
    method: "POST",
    path: `${BASE_PATH}/$verify-signature`,
    handler: externalValidator(
      async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) => {
        const outerBundle = getPayload(request) as fhir.Resource
        if (!isBundle(outerBundle)) {
          const operationOutcome = fhir.createOperationOutcome([
            errors.createResourceTypeIssue("Bundle")
          ])
          return responseToolkit.response(operationOutcome).code(400).type(ContentTypes.FHIR)
        }

        const requestPrescriptions: Array<fhir.Bundle> = outerBundle.entry
          .map(entry => entry.resource)
          .filter(isBundle)

        // Lookup original HL7v3 Data
        const prescriptionData: Array<MockSpineResponse> = await Promise.all(
          requestPrescriptions.map(prescription => mockSpineLookup(prescription, request, request.logger))
        )

        console.log("VerifyPrescriptionData", prescriptionData)

        // Verify signatures on HL7v3 and check it matches fhir
        request.logger.info("Verifying prescription signatures from Bundle")
        const verificationResponses = prescriptionData.map(
          (prescription, index) => verifyPrescriptionSignature(prescription, index)
        )

        const parameters: fhir.Parameters = {
          resourceType: "Parameters",
          parameter: verificationResponses
        }

        return responseToolkit.response(parameters).code(200).type(ContentTypes.FHIR)
      }
    )
  }
]

function verifyPrescriptionSignature(prescriptionData: MockSpineResponse, index: number): fhir.MultiPartParameter {
  const {fhirPrescription, hl7v3Prescription} = prescriptionData

  // Check HL7v3 signature for issues
  const hl7v3Issues = verifyHL7v3Signature(hl7v3Prescription)

  // Check HL7v3 matches FHIR
  const comparisonIssues = verifyPrescriptionsMatch(fhirPrescription, hl7v3Prescription)

  const allIssues = [...hl7v3Issues, ...comparisonIssues]

  // Return issues if they exist
  if (allIssues.length > 0) {
    return buildVerificationResultParameter(fhirPrescription, allIssues, index)
  }

  // Otherwise return success
  const issue: Array<fhir.OperationOutcomeIssue> = [{
    severity: "information",
    code: fhir.IssueCodes.INFORMATIONAL
  }]

  return buildVerificationResultParameter(fhirPrescription, issue, index)
}

function verifyPrescriptionsMatch(
  fhirPrescription: fhir.Bundle,
  hl7v3Prescription: hl7V3.ParentPrescription
): Array<fhir.OperationOutcomeIssue> {
  const issues: Array<fhir.OperationOutcomeIssue> = []

  const prescriptionIdsMatch =
    hl7v3Prescription.id._attributes.root.toLowerCase() === fhirPrescription.identifier.value.toLowerCase()
  if (!prescriptionIdsMatch) {
    console.log(
      "prescription IDs do not match ",
      hl7v3Prescription.id._attributes.root,
      fhirPrescription.identifier.value
    )
    issues.push(createFieldMismatchIssue("Prescription IDs do not match.", "Bundle.identifier.value"))
  }

  const lastUpdatedMatch =
    convertHL7V3DateTimeToIsoDateTimeString(hl7v3Prescription.effectiveTime) === fhirPrescription.meta.lastUpdated
  if (!lastUpdatedMatch) {
    console.log(
      "lastUpdated times do not match ",
      convertHL7V3DateTimeToIsoDateTimeString(hl7v3Prescription.effectiveTime),
      fhirPrescription.meta.lastUpdated
    )
    issues.push(createFieldMismatchIssue("lastUpdated times do not match.", "Bundle.meta.lastUpdated"))
  }

  return issues
}

function verifyHL7v3Signature(
  prescription: hl7V3.ParentPrescription,
): Array<fhir.OperationOutcomeIssue> {
  const validSignatureFormat = verifySignatureHasCorrectFormat(prescription)

  if (!validSignatureFormat) {
    return [createInvalidSignatureIssue("Invalid signature format.")]
  }

  const validSignature = verifyPrescriptionSignatureValid(prescription)
  const matchingSignature = verifySignatureDigestMatchesPrescription(prescription)
  const issues: Array<fhir.OperationOutcomeIssue> = []

  if (!validSignature) {
    issues.push(createInvalidSignatureIssue("Signature is invalid."))
  }

  if (!matchingSignature) {
    issues.push(createInvalidSignatureIssue("Signature doesn't match prescription."))
  }

  return issues
}

function createFieldMismatchIssue(display: string, fhirPath: string): fhir.OperationOutcomeIssue {
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
    expression: [fhirPath]
  }
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

// Mock spike functions and types

interface MockSpineResponse {
  fhirPrescription: fhir.Bundle,
  hl7v3Prescription: hl7V3.ParentPrescription
}

async function mockSpineLookup(
  fhirPrescription: fhir.Bundle,
  request: Hapi.Request,
  logger: pino.Logger
): Promise<MockSpineResponse> {
  const firstMedicationRequest = getMedicationRequests(fhirPrescription)[0]
  const prescriptionId = firstMedicationRequest.groupIdentifier?.value
  const trackerResponse = await trackerClient.getPrescriptionById(prescriptionId, request.headers, request.logger)
  if (!trackerResponse) {
    throw new Error("mock spine lookup failed")
  }
  const hl7v3Prescription = convertParentPrescription(fhirPrescription, logger)

  return {
    fhirPrescription,
    hl7v3Prescription
  }
}

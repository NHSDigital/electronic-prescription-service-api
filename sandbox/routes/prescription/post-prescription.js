const Boom = require('boom')
const examples = require('../../services/examples')
//const fhirHelper = require('../../helpers/fhir-helper')
const requestValidator = require("../../validators/request-validator")

function verifyBundleEntryContents(request) {
  if (!requestValidator.verifyBundleEntryContainsMedicationRequest(request)) {
    throw Boom.badRequest(
      "Request must contain at least one 'MedicationRequest' entry",
      {operationOutcomeCode: "value", apiErrorCode: "MISSING_FIELD"}
    )
  }

  if (!requestValidator.verifyBundleEntryContainsOnePatient(request)) {
    throw Boom.badRequest(
      "Request must contain one 'Patient' entry",
      {operationOutcomeCode: "value", apiErrorCode: "MISSING_FIELD"}
    )
  }

  if (!requestValidator.verifyBundleEntryContainsPractitioner(request)) {
    throw Boom.badRequest(
      "Request must contain at least one 'Practitioner' entry",
      {operationOutcomeCode: "value", apiErrorCode: "MISSING_FIELD"}
    )
  }

  if (!requestValidator.verifyBundleEntryContainsOneEncounter(request)) {
    throw Boom.badRequest(
      "Request must contain one 'Encounter' entry",
      {operationOutcomeCode: "value", apiErrorCode: "MISSING_FIELD"}
    )
  }

  if (!requestValidator.verifyBundleEntryContainsTwoOrganizations(request)) {
    throw Boom.badRequest(
      "Request must contain two 'Organization' entries",
      {operationOutcomeCode: "value", apiErrorCode: "MISSING_FIELD"}
    )
  }
}

module.exports = [
  /*
    Convert a FHIR prescription into the HL7 V3 signature elements to be signed by the prescriber.
  */
  {
    method: 'POST',
    path: '/Prescription',
    handler: (request, h) => {
      if (!requestValidator.verifyResourceTypeIsBundle(request)) {
        throw Boom.badRequest(
          "ResourceType must be 'Bundle' on request",
          {operationOutcomeCode: "value", apiErrorCode: "INCORRECT_RESOURCETYPE"}
        )
      }

      if (!requestValidator.verifyBundleContainsEntries(request)) {
        throw Boom.badRequest(
          "ResourceType Bundle must contain 'entry' field",
          {operationOutcomeCode: "value", apiErrorCode: "MISSING_FIELD"}
        )
      }

      verifyBundleEntryContents(request)

      if (request.payload.id === examples.prescriptionPostSuccessRequest.id) {
        //TODO add meta to the response schema and use fhirHelper
        //return fhirHelper.createFhirResponse(h, examples.prescriptionPostSuccessResponse)
        return h.response(examples.prescriptionPostSuccessResponse)
      } else {
        throw Boom.badRequest("Unsupported prescription id", {operationOutcomeCode: "value", apiErrorCode: "unsupportedPrescriptionId"})
      }
    }
  }
]

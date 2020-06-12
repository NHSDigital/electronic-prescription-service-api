const examples = require('../services/examples')

function create(validation, requestPayloadId) 
{
  if (validation.length > 0)
  {
    /* Reformat errors to FHIR spec
      * v.operationOutcomeCode: from the [IssueType ValueSet](https://www.hl7.org/fhir/valueset-issue-type.html)
      * v.apiErrorCode: Our own code defined for each particular error. Refer to OAS.
    */
    const fhirError = {
      resourceType: "OperationOutcome",
      issue: validation.map(v => [{
        severity: "error",
        code: v.operationOutcomeCode,
        details: {
          coding: [{
            system: "https://fhir.nhs.uk/R4/CodeSystem/Spine-ErrorOrWarningCode",
            version: 1,
            code: v.apiErrorCode,
            display: v.message
          }]
        }
      }])
    }    

    return fhirError
  }
  else {
    var response = Object.entries(examples)
      .map(exampleKeyValuePair => exampleKeyValuePair[1])
      .find(example => example.id === requestPayloadId)

    return response
  }
}

module.exports = {
  create
}
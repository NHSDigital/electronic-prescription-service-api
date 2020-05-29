const XMLS = require("xml-js");

function fhirToHl7v3(fhirMessage) {
  let returnObject = produceIntermediateJson(fhirMessage)
  const options = {compact: true, ignoreComment: true, spaces: 4}
  return XMLS.js2xml(returnObject, options);
}

function produceIntermediateJson(fhirMessage){
  const fhirObject = JSON.parse(fhirMessage);
  const parentPrescriptionAttributes = {"xmlns":"urn:hl7-org:v3",
    "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
    "classCode": "INFO",
    "moodCode": "EVN",
    "xsi:schemaLocation": "urn:hl7-org:v3 ..\\Schemas\\PORX_MT132004UK31.xsd"};
  const returnObject = {"ParentPrescription": {"_attributes": parentPrescriptionAttributes}}

  returnObject.ParentPrescription["id"] = {"_attributes": {"root": fhirObject.id}}

  return returnObject
}

module.exports = {
  fhirToHl7v3
}

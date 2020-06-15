import * as translationService from "../../src/services/translation-service"
import bundle from "../resources/parent-prescription-fhir-1"
import * as fhir from "../../src/services/fhir-resources";
import * as TestResources from "../resources/test-resources"
import * as XmlJs from "xml-js";
import {convertBundleToParentPrescription} from "../../src/services/translation-service";

function clone<T>(input: T) {
    return JSON.parse(JSON.stringify(input))
}

test('getResourcesOfType returns correct resources', () => {
    const result = translationService.getResourcesOfType(bundle, "MedicationRequest")
    expect(result).toBeInstanceOf(Array)
    expect(result).toHaveLength(4)
    result.map(x => expect((x as fhir.Resource).resourceType).toBe("MedicationRequest"))
})

test('getResourceForFullUrl returns correct resources', () => {
    const result = translationService.getResourceForFullUrl(bundle, bundle.entry[0].fullUrl)
    expect((result as fhir.Resource).resourceType).toBe("MedicationRequest")
})

test('getResourceForFullUrl throws error when finding multiple resources', () => {
    const bundle2 = clone(bundle)
    bundle2.entry[1].fullUrl = bundle2.entry[0].fullUrl
    expect(() => translationService.getResourceForFullUrl(bundle2, bundle2.entry[0].fullUrl)).toThrow(TypeError)
})

test('getIdentifierValueForSystem returns correct value for system', () => {
    const firstEntryId = clone(bundle.entry[0].resource.groupIdentifier)
    const result = translationService.getIdentifierValueForSystem(firstEntryId, firstEntryId[0].system)
    expect(result).toBe(firstEntryId[0].value)
})

test('getIdentifierValueForSystem throws error when finding multiple values for system', () => {
    const firstEntryId = clone(bundle.entry[0].resource.groupIdentifier)
    firstEntryId[1].system = firstEntryId[0].system
    expect(() => translationService.getIdentifierValueForSystem(firstEntryId, firstEntryId[0].system)).toThrow()
})

test('convertBundleToParentPrescription returns correct value', () => {
    const mockConvertPatient = jest.fn()
    const mockValue = ""
    mockConvertPatient.mockReturnValueOnce(mockValue)
    const mockConvertBundleToPrescription = jest.fn()
    mockConvertBundleToPrescription.mockReturnValueOnce(mockValue)
    const expected = "{\"_attributes\":{\"xmlns\":\"urn:hl7-org:v3\",\"xmlns:xsi\":\"http://www.w3.org/2001/XMLSchema-instance\",\"classCode\":\"INFO\",\"moodCode\":\"EVN\",\"xsi:schemaLocation\":\"urn:hl7-org:v3 ..\\\\Schemas\\\\PORX_MT132004UK31.xsd\"},\"code\":{\"_attributes\":{\"codeSystem\":\"2.16.840.1.113883.2.1.3.2.4.15\",\"code\":\"163501000000109\",\"displayName\":\"Prescription\"}},\"typeId\":{\"_attributes\":{\"root\":\"2.16.840.1.113883.2.1.3.2.4.18.7\",\"extension\":\"PORX_MT132004UK31\"}},\"id\":{\"_attributes\":{\"root\":\"baca8053-ca7b-4c8f-19ca-b447db9525e5\"}},\"effectiveTime\":{\"_attributes\":{\"value\":\"2008-02-27T11:38:00+00:00\"}},\"recordTarget\":{\"_attributes\":{\"typeCode\":\"RCT\"},\"Patient\":\""
        + `${mockValue}`
        + "\"},\"pertinentInformation1\":{\"_attributes\":{\"typeCode\":\"PERT\",\"contextConductionInd\":true},\"templateId\":{\"_attributes\":{\"root\":\"2.16.840.1.113883.2.1.3.2.4.18.2\",\"extension\":\"CSAB_RM-NPfITUK10.pertinentInformation\"}},\"pertinentPrescription\":\""
        + `${mockValue}` + "\"}}"
    const mockConvertPatientExpectedArg1 = {"entry": [{"fullUrl": "urn:uuid:8a596d71-e475-48a9-2a32-2d88192a1f2b", "resource": {"authoredOn": "2008-02-27T11:38:00+00:00", "category": [{"coding": [{"code": "0001", "system": "urn:oid:2.16.840.1.113883.2.1.3.2.4.17.25"}]}], "dispenseRequest": {"quantity": {"code": "3319411000001109", "system": "http://snomed.info/sct", "unit": "tablet", "value": 28}}, "dosageInstruction": [{"text": "1 tablet after breakfast"}], "encounter": {"reference": "urn:uuid:fc695c22-87b4-42f2-84d1-9ca9fabf7389"}, "groupIdentifier": [{"system": "urn:uuid", "value": "b4416cec-71a4-4423-01d5-312e6e58796c"}, {"system": "urn:oid:2.16.840.1.113883.2.1.3.2.4.18.8", "value": "648266-EDFABA-045634"}], "id": "8a596d71-e475-48a9-2a32-2d88192a1f2b", "intent": "order", "medicationCodeableConcept": {"coding": [{"code": "317896006", "display": "Digoxin 125 microgram oral tablet", "system": "http://snomed.info/sct"}]}, "recorder": {"reference": "urn:uuid:dbaa616b-e23c-4d53-0f82-b2d178db79ca"}, "requester": {"reference": "urn:uuid:dbaa616b-e23c-4d53-0f82-b2d178db79ca"}, "resourceType": "MedicationRequest", "status": "active", "subject": {"reference": "urn:uuid:b96806f2-0e43-4046-30f3-bd444965afb3"}}}, {"fullUrl": "urn:uuid:6e610ebd-f9a0-49c3-39c8-3edf199de727", "resource": {"authoredOn": "2008-02-27T11:38:00+00:00", "category": [{"coding": [{"code": "0001", "system": "urn:oid:2.16.840.1.113883.2.1.3.2.4.17.25"}]}], "dispenseRequest": {"quantity": {"code": "3319411000001109", "system": "http://snomed.info/sct", "unit": "tablet", "value": 28}}, "dosageInstruction": [{"text": "1 tablet during breakfast"}], "encounter": {"reference": "urn:uuid:fc695c22-87b4-42f2-84d1-9ca9fabf7389"}, "groupIdentifier": [{"system": "urn:uuid", "value": "b4416cec-71a4-4423-01d5-312e6e58796c"}, {"system": "urn:oid:2.16.840.1.113883.2.1.3.2.4.18.8", "value": "648266-EDFABA-045634"}], "id": "6e610ebd-f9a0-49c3-39c8-3edf199de727", "intent": "order", "medicationCodeableConcept": {"coding": [{"code": "319775004", "display": "Aspirin 75 mg oral tablet", "system": "http://snomed.info/sct"}]}, "recorder": {"reference": "urn:uuid:dbaa616b-e23c-4d53-0f82-b2d178db79ca"}, "requester": {"reference": "urn:uuid:dbaa616b-e23c-4d53-0f82-b2d178db79ca"}, "resourceType": "MedicationRequest", "status": "active", "subject": {"reference": "urn:uuid:b96806f2-0e43-4046-30f3-bd444965afb3"}}}, {"fullUrl": "urn:uuid:c8badc15-19df-4b37-3606-306d57fd79e5", "resource": {"authoredOn": "2008-02-27T11:38:00+00:00", "category": [{"coding": [{"code": "0001", "system": "urn:oid:2.16.840.1.113883.2.1.3.2.4.17.25"}]}], "dispenseRequest": {"quantity": {"code": "3319411000001109", "system": "http://snomed.info/sct", "unit": "tablet", "value": 84}}, "dosageInstruction": [{"text": "3 tablets before breakfast"}], "encounter": {"reference": "urn:uuid:fc695c22-87b4-42f2-84d1-9ca9fabf7389"}, "groupIdentifier": [{"system": "urn:uuid", "value": "b4416cec-71a4-4423-01d5-312e6e58796c"}, {"system": "urn:oid:2.16.840.1.113883.2.1.3.2.4.18.8", "value": "648266-EDFABA-045634"}], "id": "c8badc15-19df-4b37-3606-306d57fd79e5", "intent": "order", "medicationCodeableConcept": {"coding": [{"code": "377145005", "display": "Lorazepam 2 mg oral tablet", "system": "http://snomed.info/sct"}]}, "recorder": {"reference": "urn:uuid:dbaa616b-e23c-4d53-0f82-b2d178db79ca"}, "requester": {"reference": "urn:uuid:dbaa616b-e23c-4d53-0f82-b2d178db79ca"}, "resourceType": "MedicationRequest", "status": "active", "subject": {"reference": "urn:uuid:b96806f2-0e43-4046-30f3-bd444965afb3"}}}, {"fullUrl": "urn:uuid:4357ccdf-80c1-40fb-1e72-5b64c95d66ee", "resource": {"authoredOn": "2008-02-27T11:38:00+00:00", "category": [{"coding": [{"code": "0001", "system": "urn:oid:2.16.840.1.113883.2.1.3.2.4.17.25"}]}], "dispenseRequest": {"quantity": {"code": "3319411000001109", "system": "http://snomed.info/sct", "unit": "tablet", "value": 56}}, "dosageInstruction": [{"text": "2 tablets after breakfast"}], "encounter": {"reference": "urn:uuid:fc695c22-87b4-42f2-84d1-9ca9fabf7389"}, "groupIdentifier": [{"system": "urn:uuid", "value": "b4416cec-71a4-4423-01d5-312e6e58796c"}, {"system": "urn:oid:2.16.840.1.113883.2.1.3.2.4.18.8", "value": "648266-EDFABA-045634"}], "id": "4357ccdf-80c1-40fb-1e72-5b64c95d66ee", "intent": "order", "medicationCodeableConcept": {"coding": [{"code": "421375004", "display": "Citalopram (as citalopram hydrobromide) 40 mg orodispersible tablet", "system": "http://snomed.info/sct"}]}, "recorder": {"reference": "urn:uuid:dbaa616b-e23c-4d53-0f82-b2d178db79ca"}, "requester": {"reference": "urn:uuid:dbaa616b-e23c-4d53-0f82-b2d178db79ca"}, "resourceType": "MedicationRequest", "status": "active", "subject": {"reference": "urn:uuid:b96806f2-0e43-4046-30f3-bd444965afb3"}}}, {"fullUrl": "urn:uuid:b96806f2-0e43-4046-30f3-bd444965afb3", "resource": {"address": [{"city": "Leeds", "line": ["1 Otley Road,"], "postalCode": "LS6 5RU", "type": "both", "use": "home"}], "birthDate": "1973-04-21", "gender": "male", "generalPractitioner": {"reference": "urn:uuid:dbaa616b-e23c-4d53-0f82-b2d178db79ca"}, "id": "b96806f2-0e43-4046-30f3-bd444965afb3", "identifier": [{"system": "https://fhir.nhs.uk/Id/nhs-number", "value": "9900008464"}], "name": [{"family": "Anderson", "given": ["Michael", "Jack"], "prefix": ["Mr"], "use": "official"}], "resourceType": "Patient"}}, {"fullUrl": "urn:uuid:dbaa616b-e23c-4d53-0f82-b2d178db79ca", "resource": {"id": "dbaa616b-e23c-4d53-0f82-b2d178db79ca", "organization": {"reference": "urn:uuid:b65dd3a2-9551-45a3-3e9d-342f8de14d8f"}, "practitioner": {"reference": "urn:uuid:d4b569e7-ccf6-4bb2-029b-34b6f3e82acf"}, "resourceType": "PractitionerRole"}}, {"fullUrl": "urn:uuid:d4b569e7-ccf6-4bb2-029b-34b6f3e82acf", "resource": {"id": "d4b569e7-ccf6-4bb2-029b-34b6f3e82acf", "identifier": [{"system": "https://fhir.nhs.uk/Id/sds-user-id", "value": "125686540025"}, {"system": "https://fhir.nhs.uk/Id/sds-job-role-id", "value": "R0260"}, {"system": "https://fhir.nhs.uk/Id/sds-role-profile-id", "value": "934565838956"}], "name": [{"family": "Hurst", "prefix": ["Dr"], "use": "official"}], "resourceType": "Practitioner", "telecom": [{"system": "phone", "use": "work", "value": "tel:011327534256"}]}}, {"fullUrl": "urn:uuid:fc695c22-87b4-42f2-84d1-9ca9fabf7389", "resource": {"class": {"code": "AMB", "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode"}, "id": "fc695c22-87b4-42f2-84d1-9ca9fabf7389", "resourceType": "Encounter", "serviceProvider": {"reference": "urn:uuid:b65dd3a2-9551-45a3-3e9d-342f8de14d8f"}, "status": "finished"}}, {"fullUrl": "urn:uuid:b65dd3a2-9551-45a3-3e9d-342f8de14d8f", "resource": {"address": [{"city": "Leeds", "line": ["1 Princes Street"], "postalCode": "LS1 5AH", "type": "both", "use": "work"}], "id": "b65dd3a2-9551-45a3-3e9d-342f8de14d8f", "identifier": [{"system": "https://fhir.nhs.uk/Id/ods-organization-code", "value": "M85011"}], "name": "Signing_Surg_1", "partOf": {"reference": "urn:uuid:cc850777-b73f-43cd-23f8-a41a7f1e8459"}, "resourceType": "Organization", "telecom": [{"system": "phone", "use": "work", "value": "tel:01132754568"}], "type": [{"coding": [{"code": "001", "display": "General Medical Practice", "system": "urn:oid:2.16.840.1.113883.2.1.3.2.4.17.94"}]}]}}, {"fullUrl": "urn:uuid:cc850777-b73f-43cd-23f8-a41a7f1e8459", "resource": {"id": "cc850777-b73f-43cd-23f8-a41a7f1e8459", "identifier": [{"system": "https://fhir.nhs.uk/Id/ods-organization-code", "value": "4CD"}], "name": "West Yorkshire", "resourceType": "Organization", "type": [{"coding": [{"code": "005", "display": "Primary Care Trust", "system": "urn:oid:2.16.840.1.113883.2.1.3.2.4.17.94"}]}]}}], "id": "baca8053-ca7b-4c8f-19ca-b447db9525e5", "resourceType": "Bundle", "type": "collection"}
    const mockConvertPatientExpectedArg2 = {"address": [{"city": "Leeds", "line": ["1 Otley Road,"], "postalCode": "LS6 5RU", "type": "both", "use": "home"}], "birthDate": "1973-04-21", "gender": "male", "generalPractitioner": {"reference": "urn:uuid:dbaa616b-e23c-4d53-0f82-b2d178db79ca"}, "id": "b96806f2-0e43-4046-30f3-bd444965afb3", "identifier": [{"system": "https://fhir.nhs.uk/Id/nhs-number", "value": "9900008464"}], "name": [{"family": "Anderson", "given": ["Michael", "Jack"], "prefix": ["Mr"], "use": "official"}], "resourceType": "Patient"}
    const mockConvertBundleToPrescriptionArg = {"entry": [{"fullUrl": "urn:uuid:8a596d71-e475-48a9-2a32-2d88192a1f2b", "resource": {"authoredOn": "2008-02-27T11:38:00+00:00", "category": [{"coding": [{"code": "0001", "system": "urn:oid:2.16.840.1.113883.2.1.3.2.4.17.25"}]}], "dispenseRequest": {"quantity": {"code": "3319411000001109", "system": "http://snomed.info/sct", "unit": "tablet", "value": 28}}, "dosageInstruction": [{"text": "1 tablet after breakfast"}], "encounter": {"reference": "urn:uuid:fc695c22-87b4-42f2-84d1-9ca9fabf7389"}, "groupIdentifier": [{"system": "urn:uuid", "value": "b4416cec-71a4-4423-01d5-312e6e58796c"}, {"system": "urn:oid:2.16.840.1.113883.2.1.3.2.4.18.8", "value": "648266-EDFABA-045634"}], "id": "8a596d71-e475-48a9-2a32-2d88192a1f2b", "intent": "order", "medicationCodeableConcept": {"coding": [{"code": "317896006", "display": "Digoxin 125 microgram oral tablet", "system": "http://snomed.info/sct"}]}, "recorder": {"reference": "urn:uuid:dbaa616b-e23c-4d53-0f82-b2d178db79ca"}, "requester": {"reference": "urn:uuid:dbaa616b-e23c-4d53-0f82-b2d178db79ca"}, "resourceType": "MedicationRequest", "status": "active", "subject": {"reference": "urn:uuid:b96806f2-0e43-4046-30f3-bd444965afb3"}}}, {"fullUrl": "urn:uuid:6e610ebd-f9a0-49c3-39c8-3edf199de727", "resource": {"authoredOn": "2008-02-27T11:38:00+00:00", "category": [{"coding": [{"code": "0001", "system": "urn:oid:2.16.840.1.113883.2.1.3.2.4.17.25"}]}], "dispenseRequest": {"quantity": {"code": "3319411000001109", "system": "http://snomed.info/sct", "unit": "tablet", "value": 28}}, "dosageInstruction": [{"text": "1 tablet during breakfast"}], "encounter": {"reference": "urn:uuid:fc695c22-87b4-42f2-84d1-9ca9fabf7389"}, "groupIdentifier": [{"system": "urn:uuid", "value": "b4416cec-71a4-4423-01d5-312e6e58796c"}, {"system": "urn:oid:2.16.840.1.113883.2.1.3.2.4.18.8", "value": "648266-EDFABA-045634"}], "id": "6e610ebd-f9a0-49c3-39c8-3edf199de727", "intent": "order", "medicationCodeableConcept": {"coding": [{"code": "319775004", "display": "Aspirin 75 mg oral tablet", "system": "http://snomed.info/sct"}]}, "recorder": {"reference": "urn:uuid:dbaa616b-e23c-4d53-0f82-b2d178db79ca"}, "requester": {"reference": "urn:uuid:dbaa616b-e23c-4d53-0f82-b2d178db79ca"}, "resourceType": "MedicationRequest", "status": "active", "subject": {"reference": "urn:uuid:b96806f2-0e43-4046-30f3-bd444965afb3"}}}, {"fullUrl": "urn:uuid:c8badc15-19df-4b37-3606-306d57fd79e5", "resource": {"authoredOn": "2008-02-27T11:38:00+00:00", "category": [{"coding": [{"code": "0001", "system": "urn:oid:2.16.840.1.113883.2.1.3.2.4.17.25"}]}], "dispenseRequest": {"quantity": {"code": "3319411000001109", "system": "http://snomed.info/sct", "unit": "tablet", "value": 84}}, "dosageInstruction": [{"text": "3 tablets before breakfast"}], "encounter": {"reference": "urn:uuid:fc695c22-87b4-42f2-84d1-9ca9fabf7389"}, "groupIdentifier": [{"system": "urn:uuid", "value": "b4416cec-71a4-4423-01d5-312e6e58796c"}, {"system": "urn:oid:2.16.840.1.113883.2.1.3.2.4.18.8", "value": "648266-EDFABA-045634"}], "id": "c8badc15-19df-4b37-3606-306d57fd79e5", "intent": "order", "medicationCodeableConcept": {"coding": [{"code": "377145005", "display": "Lorazepam 2 mg oral tablet", "system": "http://snomed.info/sct"}]}, "recorder": {"reference": "urn:uuid:dbaa616b-e23c-4d53-0f82-b2d178db79ca"}, "requester": {"reference": "urn:uuid:dbaa616b-e23c-4d53-0f82-b2d178db79ca"}, "resourceType": "MedicationRequest", "status": "active", "subject": {"reference": "urn:uuid:b96806f2-0e43-4046-30f3-bd444965afb3"}}}, {"fullUrl": "urn:uuid:4357ccdf-80c1-40fb-1e72-5b64c95d66ee", "resource": {"authoredOn": "2008-02-27T11:38:00+00:00", "category": [{"coding": [{"code": "0001", "system": "urn:oid:2.16.840.1.113883.2.1.3.2.4.17.25"}]}], "dispenseRequest": {"quantity": {"code": "3319411000001109", "system": "http://snomed.info/sct", "unit": "tablet", "value": 56}}, "dosageInstruction": [{"text": "2 tablets after breakfast"}], "encounter": {"reference": "urn:uuid:fc695c22-87b4-42f2-84d1-9ca9fabf7389"}, "groupIdentifier": [{"system": "urn:uuid", "value": "b4416cec-71a4-4423-01d5-312e6e58796c"}, {"system": "urn:oid:2.16.840.1.113883.2.1.3.2.4.18.8", "value": "648266-EDFABA-045634"}], "id": "4357ccdf-80c1-40fb-1e72-5b64c95d66ee", "intent": "order", "medicationCodeableConcept": {"coding": [{"code": "421375004", "display": "Citalopram (as citalopram hydrobromide) 40 mg orodispersible tablet", "system": "http://snomed.info/sct"}]}, "recorder": {"reference": "urn:uuid:dbaa616b-e23c-4d53-0f82-b2d178db79ca"}, "requester": {"reference": "urn:uuid:dbaa616b-e23c-4d53-0f82-b2d178db79ca"}, "resourceType": "MedicationRequest", "status": "active", "subject": {"reference": "urn:uuid:b96806f2-0e43-4046-30f3-bd444965afb3"}}}, {"fullUrl": "urn:uuid:b96806f2-0e43-4046-30f3-bd444965afb3", "resource": {"address": [{"city": "Leeds", "line": ["1 Otley Road,"], "postalCode": "LS6 5RU", "type": "both", "use": "home"}], "birthDate": "1973-04-21", "gender": "male", "generalPractitioner": {"reference": "urn:uuid:dbaa616b-e23c-4d53-0f82-b2d178db79ca"}, "id": "b96806f2-0e43-4046-30f3-bd444965afb3", "identifier": [{"system": "https://fhir.nhs.uk/Id/nhs-number", "value": "9900008464"}], "name": [{"family": "Anderson", "given": ["Michael", "Jack"], "prefix": ["Mr"], "use": "official"}], "resourceType": "Patient"}}, {"fullUrl": "urn:uuid:dbaa616b-e23c-4d53-0f82-b2d178db79ca", "resource": {"id": "dbaa616b-e23c-4d53-0f82-b2d178db79ca", "organization": {"reference": "urn:uuid:b65dd3a2-9551-45a3-3e9d-342f8de14d8f"}, "practitioner": {"reference": "urn:uuid:d4b569e7-ccf6-4bb2-029b-34b6f3e82acf"}, "resourceType": "PractitionerRole"}}, {"fullUrl": "urn:uuid:d4b569e7-ccf6-4bb2-029b-34b6f3e82acf", "resource": {"id": "d4b569e7-ccf6-4bb2-029b-34b6f3e82acf", "identifier": [{"system": "https://fhir.nhs.uk/Id/sds-user-id", "value": "125686540025"}, {"system": "https://fhir.nhs.uk/Id/sds-job-role-id", "value": "R0260"}, {"system": "https://fhir.nhs.uk/Id/sds-role-profile-id", "value": "934565838956"}], "name": [{"family": "Hurst", "prefix": ["Dr"], "use": "official"}], "resourceType": "Practitioner", "telecom": [{"system": "phone", "use": "work", "value": "tel:011327534256"}]}}, {"fullUrl": "urn:uuid:fc695c22-87b4-42f2-84d1-9ca9fabf7389", "resource": {"class": {"code": "AMB", "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode"}, "id": "fc695c22-87b4-42f2-84d1-9ca9fabf7389", "resourceType": "Encounter", "serviceProvider": {"reference": "urn:uuid:b65dd3a2-9551-45a3-3e9d-342f8de14d8f"}, "status": "finished"}}, {"fullUrl": "urn:uuid:b65dd3a2-9551-45a3-3e9d-342f8de14d8f", "resource": {"address": [{"city": "Leeds", "line": ["1 Princes Street"], "postalCode": "LS1 5AH", "type": "both", "use": "work"}], "id": "b65dd3a2-9551-45a3-3e9d-342f8de14d8f", "identifier": [{"system": "https://fhir.nhs.uk/Id/ods-organization-code", "value": "M85011"}], "name": "Signing_Surg_1", "partOf": {"reference": "urn:uuid:cc850777-b73f-43cd-23f8-a41a7f1e8459"}, "resourceType": "Organization", "telecom": [{"system": "phone", "use": "work", "value": "tel:01132754568"}], "type": [{"coding": [{"code": "001", "display": "General Medical Practice", "system": "urn:oid:2.16.840.1.113883.2.1.3.2.4.17.94"}]}]}}, {"fullUrl": "urn:uuid:cc850777-b73f-43cd-23f8-a41a7f1e8459", "resource": {"id": "cc850777-b73f-43cd-23f8-a41a7f1e8459", "identifier": [{"system": "https://fhir.nhs.uk/Id/ods-organization-code", "value": "4CD"}], "name": "West Yorkshire", "resourceType": "Organization", "type": [{"coding": [{"code": "005", "display": "Primary Care Trust", "system": "urn:oid:2.16.840.1.113883.2.1.3.2.4.17.94"}]}]}}], "id": "baca8053-ca7b-4c8f-19ca-b447db9525e5", "resourceType": "Bundle", "type": "collection"}

    expect(JSON.stringify(translationService.convertBundleToParentPrescription(clone(bundle), mockConvertPatient, mockConvertBundleToPrescription))).toBe(expected)
    expect(mockConvertPatient).toHaveBeenCalledWith(mockConvertPatientExpectedArg1, mockConvertPatientExpectedArg2)
    expect(mockConvertBundleToPrescription).toHaveBeenCalledWith(mockConvertBundleToPrescriptionArg)
})

test('convertBundleToParentPrescription returns correct value', () => {
    const mockValue = ""

    const mockConvertGender = jest.fn()
    mockConvertGender.mockReturnValueOnce(mockValue)
    const mockConvertAddress = jest.fn()
    mockConvertAddress.mockReturnValueOnce(mockValue)
    const mockConvertName = jest.fn()
    mockConvertName.mockReturnValueOnce(mockValue)
    const mockConvertGenderExpectedArg = "male"
    const mockConvertAddressExpectedArg = [{}]
    const mockConvertNameExpectedArg = [{}]

    // const mockPatient = {"resourceType": "Patient",
    //     "identifier": [
    //         {"system": "https://fhir.nhs.uk/Id/nhs-number", "value": ""}],
    //     "address": mockConvertAddressExpectedArg,
    //     "name": mockConvertNameExpectedArg,
    //     "gender": mockConvertGenderExpectedArg
    // }

    const mockPatient = translationService.getResourceForFullUrl(bundle, (translationService.getResourcesOfType(bundle, "MedicationRequest") as Array<fhir.MedicationRequest>)[0].subject.reference)

    const expected = "{\"_attributes\":{\"classCode\":\"PAT\"},\"id\":{\"_attributes\":{\"root\":\"2.16.840.1.113883.2.1.4.1\",\"extension\":\"9900008464\"}},\"addr\":[\"\"],\"patientPerson\":{\"_attributes\":{\"classCode\":\"PSN\",\"determinerCode\":\"INSTANCE\"},\"name\":[{\"family\":\"Anderson\",\"given\":[\"Michael\",\"Jack\"],\"prefix\":[\"Mr\"]}],\"administrativeGenderCode\":\"\",\"birthTime\":{\"_attributes\":{\"value\":\"1973-04-21\"}},\"playedProviderPatient\":{\"_attributes\":{\"classCode\":\"PAT\"},\"subjectOf\":{\"_attributes\":{\"typeCode\":\"SBJ\"},\"patientCareProvision\":{\"_attributes\":{\"classCode\":\"PCPR\",\"moodCode\":\"EVN\"},\"code\":{\"_attributes\":{\"codeSystem\":\"2.16.840.1.113883.2.1.3.2.4.17.37\",\"code\":\"1\"}},\"responsibleParty\":{\"_attributes\":{\"typeCode\":\"RESP\"},\"healthCareProvider\":{\"_attributes\":{\"classCode\":\"PROV\"},\"id\":{\"_attributes\":{\"root\":\"1.2.826.0.1285.0.2.0.65\",\"extension\":\"125686540025\"}}}}}}}}}"

    expect(JSON.stringify(translationService.convertPatient(clone(bundle), mockPatient, mockConvertGender, mockConvertAddress))).toBe(expected)
    expect(mockConvertGender).toHaveBeenCalledWith(mockConvertGenderExpectedArg)
    expect(mockConvertAddress).toHaveBeenCalledWith(mockConvertAddressExpectedArg)
    expect(mockConvertName).toHaveBeenCalledWith(mockConvertNameExpectedArg)
})

test("convertBundleToParentPrescription returns correct value", () => {
    const mockPatientConverter = jest.fn().mockReturnValue(TestResources.hl7V3Patient1)
    const mockPrescriptionConverter = jest.fn().mockReturnValue(TestResources.hl7V3Prescription1)

    const actualHl7V3ParentPrescription = translationService.convertBundleToParentPrescription(bundle, mockPatientConverter, mockPrescriptionConverter);

    expect(actualHl7V3ParentPrescription.id).toEqual({
        _attributes: {
            root: "baca8053-ca7b-4c8f-19ca-b447db9525e5",
        },
    })
    expect(actualHl7V3ParentPrescription.effectiveTime).toEqual({
        _attributes: {
            value: "2008-02-27T11:38:00+00:00"
        }
    })
    expect(actualHl7V3ParentPrescription.recordTarget).toEqual(TestResources.hl7V3ParentPrescription1.recordTarget)
    expect(actualHl7V3ParentPrescription.pertinentInformation1).toEqual(TestResources.hl7V3ParentPrescription1.pertinentInformation1)

    // TODO - replace with the below once we've implemented more mappings
    // const expectedHl7V3ParentPrescription = clone(TestResources.validHl7V3ParentPrescription)
    // expectedHl7V3ParentPrescription.id = {
    //     _attributes: {
    //         root: "baca8053-ca7b-4c8f-19ca-b447db9525e5",
    //     },
    // }
    // expectedHl7V3ParentPrescription.effectiveTime = {
    //     _attributes: {
    //         value: "2008-02-27T11:38:00+00:00"
    //     }
    // }
    // expect(actualHl7V3ParentPrescription).toEqual(expectedHl7V3ParentPrescription)
})

test("convertBundleToParentPrescription returns correct value", () => {
    const options = {compact: true, spaces: 4, attributesFn: translationService.sortAttributes} as unknown as XmlJs.Options.JS2XML

    const actualRoot = {
        ParentPrescription: convertBundleToParentPrescription(bundle)
    }
    const actualXmlStr = XmlJs.js2xml(actualRoot, options)

    const expectedRoot = {
        ParentPrescription: TestResources.hl7V3ParentPrescription1
    }
    const expectedXmlStr = XmlJs.js2xml(expectedRoot, options)

    expect(actualXmlStr).toEqual(expectedXmlStr)
})

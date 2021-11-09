import * as uuid from "uuid"
import axios from "axios"
import {Bundle, OperationOutcome, Parameters} from "fhir/r4"
import {EpsClient, EpsSendReponse} from "./eps-client"

export class MockEpsClient implements EpsClient {

  async makePrepareRequest(): Promise<Parameters> {
    return Promise.resolve({
      resourceType: "Parameters",
      parameter: [
        {
          name: "digest",
          // eslint-disable-next-line max-len
          valueString: "PFNpZ25lZEluZm8geG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvMDkveG1sZHNpZyMiPjxDYW5vbmljYWxpemF0aW9uTWV0aG9kIEFsZ29yaXRobT0iaHR0cDovL3d3dy53My5vcmcvMjAwMS8xMC94bWwtZXhjLWMxNG4jIj48L0Nhbm9uaWNhbGl6YXRpb25NZXRob2Q+PFNpZ25hdHVyZU1ldGhvZCBBbGdvcml0aG09Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvMDkveG1sZHNpZyNyc2Etc2hhMSI+PC9TaWduYXR1cmVNZXRob2Q+PFJlZmVyZW5jZT48VHJhbnNmb3Jtcz48VHJhbnNmb3JtIEFsZ29yaXRobT0iaHR0cDovL3d3dy53My5vcmcvMjAwMS8xMC94bWwtZXhjLWMxNG4jIj48L1RyYW5zZm9ybT48L1RyYW5zZm9ybXM+PERpZ2VzdE1ldGhvZCBBbGdvcml0aG09Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvMDkveG1sZHNpZyNzaGExIj48L0RpZ2VzdE1ldGhvZD48RGlnZXN0VmFsdWU+RGMvYldSb21tY2Z4OVhoOHE0czBaYUUwUFdZPTwvRGlnZXN0VmFsdWU+PC9SZWZlcmVuY2U+PC9TaWduZWRJbmZvPg=="
        },
        {
          name: "timestamp",
          valueString: "2021-05-07T14:47:53+00:00"
        },
        {
          name: "algorithm",
          valueString: "RS1"
        }
      ]
    })
  }

  async makeSendRequest(body: Bundle): Promise<EpsSendReponse> {
    const url = `https://${process.env.APIGEE_DOMAIN_NAME}/electronic-prescriptions/FHIR/R4/$process-message`
    const statusCode = 200
    //TODO - why is the mock client sending real requests?
    const spineResponse = (await axios.post(url, body, {
      headers: {
        "X-Request-ID": uuid.v4(),
        "X-Raw-Response": "true"
      }
    })).data as string
    const fhirResponse: OperationOutcome = {
      resourceType: "OperationOutcome",
      issue: [
        {
          code: "informational",
          severity: "information"
        }
      ]
    }
    return Promise.resolve({statusCode, fhirResponse, spineResponse})
  }

  async makeConvertRequest(body: unknown): Promise<string> {
    const url = `https://${process.env.APIGEE_DOMAIN_NAME}/electronic-prescriptions/FHIR/R4/$convert`
    //TODO - why is the mock client sending real requests?
    const response = (await axios.post(url, body, {headers: {"X-Request-ID": uuid.v4()}})).data
    return response as string
  }

  async makeGetTrackerRequest(): Promise<Bundle | OperationOutcome> {
    return Promise.resolve({
      resourceType: "Bundle",
      type: "searchset",
      total: 1,
      entry: [{
        "resource": {
          "resourceType": "Task",
          "id": "ebbf5aa4-9c77-4d66-b875-c4d66f3132ec",
          "extension": [{
            "url": "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-Prescription",
            "extension": [{
              "url": "courseOfTherapyType",
              "valueCoding": {
                "system": "http://terminology.hl7.org/CodeSystem/medicationrequest-course-of-therapy",
                "code": "acute",
                "display": "Short course (acute) therapy"
              }
            }]
          }],
          "identifier": [{
            "system": "https://tools.ietf.org/html/rfc4122",
            "value": "ebbf5aa4-9c77-4d66-b875-c4d66f3132ec"
          }],
          "status": "requested",
          "businessStatus": {
            "coding": [{
              "system": "https://fhir.nhs.uk/CodeSystem/EPS-task-business-status",
              "code": "0001",
              "display": "To Be Dispensed"
            }]
          },
          "intent": "order",
          "code": {
            "coding": [{
              "system": "http://hl7.org/fhir/CodeSystem/task-code",
              "code": "fulfill",
              "display": "Fulfill the focal request"
            }]
          },
          "focus": {
            "identifier": {
              "system": "https://fhir.nhs.uk/Id/prescription-order-number",
              "value": "49C257-A83008-6DF993"
            }
          },
          "for": {"identifier": {"system": "https://fhir.nhs.uk/Id/nhs-number", "value": "9449304130"}},
          "authoredOn": "2021-05-07",
          "requester": {
            "identifier": {"system": "https://fhir.nhs.uk/Id/ods-organization-code", "value": "A83008"},
            "display": "HALLGARTH SURGERY"
          },
          "owner": {"identifier": {"system": "https://fhir.nhs.uk/Id/ods-organization-code", "value": "FCG71"}},
          "input": [{
            "type": {
              "coding": [{
                "system": "http://snomed.info/sct",
                "code": "16076005",
                "display": "Prescription"
              }]
            },
            "valueReference": {
              "identifier": {
                "system": "https://fhir.nhs.uk/Id/prescription-order-item-number",
                "value": "299c610b-f4f1-4eac-a7d7-4fb6b0556e11"
              }, "type": "MedicationRequest"
            },
            "extension": [{
              "url": "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-DispensingInformation",
              "extension": [{
                "url": "dispenseStatus",
                "valueCoding": {
                  "system": "https://fhir.nhs.uk/CodeSystem/medicationdispense-type",
                  "code": "0001",
                  "display": "To be Dispensed"
                }
              }]
            }]
          }, {
            "type": {"coding": [{"system": "http://snomed.info/sct", "code": "16076005", "display": "Prescription"}]},
            "valueReference": {
              "identifier": {
                "system": "https://fhir.nhs.uk/Id/prescription-order-item-number",
                "value": "5cb17f5a-11ac-4e18-825f-6470467238b3"
              }, "type": "MedicationRequest"
            },
            "extension": [{
              "url": "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-DispensingInformation",
              "extension": [{
                "url": "dispenseStatus",
                "valueCoding": {
                  "system": "https://fhir.nhs.uk/CodeSystem/medicationdispense-type",
                  "code": "0001",
                  "display": "To be Dispensed"
                }
              }]
            }]
          }],
          "output": [{
            "type": {
              "coding": [{
                "system": "http://snomed.info/sct",
                "code": "373784005",
                "display": "Dispensing medication"
              }]
            },
            "valueReference": {
              "identifier": {
                "system": "https://fhir.nhs.uk/Id/prescription-dispense-item-number",
                "value": "299c610b-f4f1-4eac-a7d7-4fb6b0556e11"
              }, "type": "MedicationDispense"
            }
          }, {
            "type": {
              "coding": [{
                "system": "http://snomed.info/sct",
                "code": "373784005",
                "display": "Dispensing medication"
              }]
            },
            "valueReference": {
              "identifier": {
                "system": "https://fhir.nhs.uk/Id/prescription-dispense-item-number",
                "value": "5cb17f5a-11ac-4e18-825f-6470467238b3"
              }, "type": "MedicationDispense"
            }
          }]
        }, "fullUrl": "urn:uuid:ebbf5aa4-9c77-4d66-b875-c4d66f3132ec"
      }]
    })
  }
}

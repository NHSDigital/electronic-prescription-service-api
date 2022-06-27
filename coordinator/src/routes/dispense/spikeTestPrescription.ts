import {fhir} from "@models"

/* eslint-disable max-len */
export const mockFhirPrescription: fhir.Bundle = {
  "resourceType": "Bundle",
  "id": "974f9202-95e0-4bbc-a4b4-9dda8110a59d",
  "meta": {
    "lastUpdated": "2022-04-28T12:04:00+00:00"
  },
  "identifier": {
    "system": "https://tools.ietf.org/html/rfc4122",
    "value": "88b3f252-9dce-e2ed-f148-185054f39c4e"
  },
  "type": "message",
  "entry": [
    {
      "fullUrl": "urn:uuid:88957687-18ab-462b-a6a9-ccae365adc5a",
      "resource": {
        "resourceType": "MessageHeader",
        "id": "88957687-18ab-462b-a6a9-ccae365adc5a",
        "extension": [
          {
            "url": "https://fhir.nhs.uk/StructureDefinition/Extension-Spine-MessageHeader-messageId",
            "valueIdentifier": {
              "system": "https://tools.ietf.org/html/rfc4122",
              "value": "88b3f252-9dce-e2ed-f148-185054f39c4e"
            }
          }
        ],
        "eventCoding": {
          "system": "https://fhir.nhs.uk/CodeSystem/message-event",
          "code": "prescription-order",
          "display": "Prescription Order"
        },
        "destination": [],
        "sender": {
          "identifier": {
            "system": "https://fhir.nhs.uk/Id/ods-organization-code",
            "value": "X2601"
          },
          "display": "NHS Digital Spine"
        },
        "source": {
          "name": "NHS Spine",
          "endpoint": "https://int.api.service.nhs.uk/electronic-prescriptions/$process-message"
        },
        "response": {
          "identifier": "d684f1f7-53b3-49a4-af0b-b0974307d798",
          "code": "ok"
        },
        "focus": [
          {
            "reference": "urn:uuid:5c3cb347-9aac-41e7-a311-5acfe2f2436d"
          },
          {
            "reference": "urn:uuid:e091d3b1-9638-4acb-85a4-fd4bd1fad5d5"
          }
        ]
      }
    },
    {
      "fullUrl": "urn:uuid:79b5ecba-6bf5-47c8-9e6f-b59e3a00c3dd",
      "resource": {
        "resourceType": "CommunicationRequest",
        "id": "79b5ecba-6bf5-47c8-9e6f-b59e3a00c3dd",
        "status": "unknown",
        "subject": {
          "reference": "urn:uuid:5c3cb347-9aac-41e7-a311-5acfe2f2436d"
        },
        "payload": [
          {
            "contentString": " Please call the practice. "
          },
          {
            "contentReference": {
              "reference": "urn:uuid:69e6226e-6d98-4600-9735-5e38d4917169"
            }
          }
        ],
        "requester": {
          "identifier": {
            "system": "https://fhir.nhs.uk/Id/ods-organization-code",
            "value": "C81007"
          }
        },
        "recipient": [
          {
            "identifier": {
              "system": "https://fhir.nhs.uk/Id/nhs-number",
              "value": "9453740993"
            }
          }
        ]
      }
    },
    {
      "fullUrl": "urn:uuid:69e6226e-6d98-4600-9735-5e38d4917169",
      "resource": {
        "resourceType": "List",
        "id": "69e6226e-6d98-4600-9735-5e38d4917169",
        "status": "current",
        "mode": "snapshot",
        "entry": [
          {
            "item": {
              "display": "Amoxicillin 250mg capsules"
            }
          }
        ]
      }
    },
    {
      "fullUrl": "urn:uuid:e091d3b1-9638-4acb-85a4-fd4bd1fad5d5",
      "resource": {
        "resourceType": "MedicationRequest",
        "id": "e091d3b1-9638-4acb-85a4-fd4bd1fad5d5",
        "extension": [
          {
            "url": "https://fhir.nhs.uk/StructureDefinition/Extension-DM-ResponsiblePractitioner",
            "valueReference": {
              "reference": "urn:uuid:03c47751-3bc6-45c4-a13b-bf0728d45eea"
            }
          },
          {
            "url": "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionType",
            "valueCoding": {
              "system": "https://fhir.nhs.uk/CodeSystem/prescription-type",
              "code": "0101"
            }
          },
          {
            "url": "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionEndorsement",
            "valueCodeableConcept": {
              "coding": [
                {
                  "code": "FS",
                  "system": "https://fhir.nhs.uk/CodeSystem/medicationrequest-endorsement"
                }
              ]
            }
          }
        ],
        "identifier": [
          {
            "system": "https://fhir.nhs.uk/Id/prescription-order-item-number",
            "value": "ddb6fd31-e7fe-83a5-e050-d20ae3a2175e"
          }
        ],
        "status": "active",
        "intent": "order",
        "medicationCodeableConcept": {
          "coding": [
            {
              "system": "http://snomed.info/sct",
              "code": "323509004",
              "display": "Amoxicillin 250mg capsules"
            }
          ]
        },
        "subject": {
          "reference": "urn:uuid:5c3cb347-9aac-41e7-a311-5acfe2f2436d"
        },
        "authoredOn": "2022-04-28T12:04:00+00:00",
        "category": [
          {
            "coding": [
              {
                "system": "http://terminology.hl7.org/CodeSystem/medicationrequest-category",
                "code": "outpatient",
                "display": "Outpatient"
              }
            ]
          }
        ],
        "requester": {
          "reference": "urn:uuid:03c47751-3bc6-45c4-a13b-bf0728d45eea"
        },
        "groupIdentifier": {
          "system": "https://fhir.nhs.uk/Id/prescription-order-number",
          "value": "56ED1F-C81007-00001C",
          "extension": [
            {
              "url": "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionId",
              "valueIdentifier": {
                "system": "https://fhir.nhs.uk/Id/prescription",
                "value": "ddb6fd31-e73b-83a5-e050-d20ae3a2175e"
              }
            }
          ]
        },
        "courseOfTherapyType": {
          "coding": [
            {
              "system": "http://terminology.hl7.org/CodeSystem/medicationrequest-course-of-therapy",
              "code": "acute",
              "display": "Short course (acute) therapy"
            }
          ]
        },
        "dosageInstruction": [
          {
            "text": "As Directed"
          }
        ],
        "dispenseRequest": {
          "extension": [
            {
              "url": "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PerformerSiteType",
              "valueCoding": {
                "system": "https://fhir.nhs.uk/CodeSystem/dispensing-site-preference",
                "code": "0004"
              }
            }
          ],
          "numberOfRepeatsAllowed": 0,
          "quantity": {
            "value": 15,
            "unit": "capsule",
            "system": "http://snomed.info/sct",
            "code": "428641000"
          },
          "expectedSupplyDuration": {
            "unit": "days",
            "value": 28,
            "system": "http://unitsofmeasure.org",
            "code": "d"
          }
        },
        "substitution": {
          "allowedBoolean": false
        }
      }
    },
    {
      "fullUrl": "urn:uuid:5c3cb347-9aac-41e7-a311-5acfe2f2436d",
      "resource": {
        "resourceType": "Patient",
        "id": "5c3cb347-9aac-41e7-a311-5acfe2f2436d",
        "identifier": [
          {
            "system": "https://fhir.nhs.uk/Id/nhs-number",
            "value": "9453740993"
          }
        ],
        "name": [
          {
            "use": "usual",
            "family": "ALEXANDER",
            "given": [
              "BLAKE",
              "CONWAY"
            ],
            "prefix": [
              "MR"
            ],
            "suffix": [
              null
            ]
          }
        ],
        "gender": "unknown",
        "birthDate": "1949-09-23",
        "address": [
          {
            "use": "home",
            "line": [
              "11 TRENT STREET",
              "ALVASTON",
              "DERBY"
            ],
            "postalCode": "DE24 8RY"
          }
        ],
        "generalPractitioner": [
          {
            "identifier": {
              "system": "https://fhir.nhs.uk/Id/ods-organization-code",
              "value": "C81007"
            }
          }
        ]
      }
    },
    {
      "fullUrl": "urn:uuid:9f1e815c-13a6-4b44-9252-170ee56a9ba6",
      "resource": {
        "resourceType": "Practitioner",
        "id": "9f1e815c-13a6-4b44-9252-170ee56a9ba6",
        "identifier": [
          {
            "system": "https://fhir.hl7.org.uk/Id/gphc-number",
            "value": "3021802"
          },
          {
            "system": "https://fhir.hl7.org.uk/Id/din-number",
            "value": "930211"
          }
        ],
        "name": [
          {
            "use": "usual",
            "family": "WEIR",
            "given": [
              "BABY"
            ]
          }
        ]
      }
    },
    {
      "fullUrl": "urn:uuid:03c47751-3bc6-45c4-a13b-bf0728d45eea",
      "resource": {
        "resourceType": "PractitionerRole",
        "id": "03c47751-3bc6-45c4-a13b-bf0728d45eea",
        "identifier": [
          {
            "system": "https://fhir.nhs.uk/Id/sds-role-profile-id",
            "value": "100096757983"
          }
        ],
        "practitioner": {
          "reference": "urn:uuid:9f1e815c-13a6-4b44-9252-170ee56a9ba6"
        },
        "code": [
          {
            "coding": [
              {
                "system": "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
                "code": "R0260",
                "display": "R0260"
              }
            ]
          }
        ],
        "telecom": [
          {
            "system": "phone",
            "use": "work",
            "value": "01512631737"
          }
        ],
        "organization": {
          "reference": "urn:uuid:5dcd1a40-d045-4221-b27f-30e4ec5375dc"
        }
      }
    },
    {
      "fullUrl": "urn:uuid:5dcd1a40-d045-4221-b27f-30e4ec5375dc",
      "resource": {
        "resourceType": "Organization",
        "id": "5dcd1a40-d045-4221-b27f-30e4ec5375dc",
        "identifier": [
          {
            "system": "https://fhir.nhs.uk/Id/ods-organization-code",
            "value": "C81007"
          }
        ],
        "type": [
          {
            "coding": [
              {
                "system": "https://fhir.nhs.uk/CodeSystem/organisation-role",
                "code": "179",
                "display": "PRIMARY CARE TRUST"
              }
            ]
          }
        ],
        "name": "VERNON STREET MEDICAL CTR",
        "telecom": [
          {
            "system": "phone",
            "use": "work",
            "value": "01512631737"
          }
        ],
        "address": [
          {
            "use": "work",
            "line": [
              "13 VERNON STREET",
              "DERBY",
              "DERBYSHIRE"
            ],
            "postalCode": "DE1 1FW"
          }
        ],
        "partOf": {
          "identifier": {
            "system": "https://fhir.nhs.uk/Id/ods-organization-code",
            "value": "5EX"
          },
          "display": "GREATER DERBY PCT"
        }
      }
    },
    {
      "fullUrl": "urn:uuid:5a42a26e-db0c-4b22-990e-51ab3fb5029c",
      "resource": {
        "resourceType": "Provenance",
        "id": "5a42a26e-db0c-4b22-990e-51ab3fb5029c",
        "agent": [
          {
            "who": {
              "reference": "urn:uuid:03c47751-3bc6-45c4-a13b-bf0728d45eea"
            }
          }
        ],
        "recorded": "2022-04-28T12:04:00+00:00",
        "signature": [
          {
            "who": {
              "reference": "urn:uuid:03c47751-3bc6-45c4-a13b-bf0728d45eea"
            },
            "when": "2022-04-28T12:04:00+00:00",
            "data": "PFNpZ25hdHVyZSB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC8wOS94bWxkc2lnIyI+PFNpZ25lZEluZm8+PENhbm9uaWNhbGl6YXRpb25NZXRob2QgQWxnb3JpdGhtPSJodHRwOi8vd3d3LnczLm9yZy8yMDAxLzEwL3htbC1leGMtYzE0biMiPjwvQ2Fub25pY2FsaXphdGlvbk1ldGhvZD48U2lnbmF0dXJlTWV0aG9kIEFsZ29yaXRobT0iaHR0cDovL3d3dy53My5vcmcvMjAwMC8wOS94bWxkc2lnI3JzYS1zaGExIj48L1NpZ25hdHVyZU1ldGhvZD48UmVmZXJlbmNlPjxUcmFuc2Zvcm1zPjxUcmFuc2Zvcm0gQWxnb3JpdGhtPSJodHRwOi8vd3d3LnczLm9yZy8yMDAxLzEwL3htbC1leGMtYzE0biMiPjwvVHJhbnNmb3JtPjwvVHJhbnNmb3Jtcz48RGlnZXN0TWV0aG9kIEFsZ29yaXRobT0iaHR0cDovL3d3dy53My5vcmcvMjAwMC8wOS94bWxkc2lnI3NoYTEiPjwvRGlnZXN0TWV0aG9kPjxEaWdlc3RWYWx1ZT4rRFZvaUYwQmJza2t5ZGJ0cUFqYU5YVXB2RzQ9PC9EaWdlc3RWYWx1ZT48L1JlZmVyZW5jZT48L1NpZ25lZEluZm8+PFNpZ25hdHVyZVZhbHVlPmp3QXRUVnFSTE1OSEkwaUNJMjVYNkdTOGlJczlpR1JsSVMwSnRaSGJiMkRVZ21CcGUvYURLeHlvYlMwWWV6ak1YQXIzYTRoOUhLSFIKNXFPdnFXbUFSSmhuSTlyaFVHZk96QWR5S2I5M3p5Q2pHa1Y0U2o0UVRlOFhCRWhjRmxrcVJaWEhaT2g1VGNQMDFQanBVbURzcmd4ZgpqOFNsOXc3N0dqdG9IbDJMZ1pubGpFTEphUHR0cTZqTnptaXhrUTgydFFMUlNPTC9yelAyL2lJOHVDVDU0Z0xGVFp1Y3YzZC9lTmJOCjVsaXFrNUo0eWxaYnZMa2o2NEpmMHNVR3F2bi9ROWVIQ3dxYndXeHdZRnVQRUgzQlRrUldDcStiSTQ0c09CTGRJOHZzVEpKdFZEQnQKajhidW94cC8xbUhkNFlDaFRSLzlVTGxuVmc5TkswalJUNklXYnc9PTwvU2lnbmF0dXJlVmFsdWU+PEtleUluZm8+PFg1MDlEYXRhPjxYNTA5Q2VydGlmaWNhdGU+TUlJRDJ6Q0NBc09nQXdJQkFnSUpBSWtRM0piaWdPc2RNQTBHQ1NxR1NJYjNEUUVCQ3dVQU1FUXhEakFNQmdOVkJBb1RCVWhUUTBsRApNUkV3RHdZRFZRUUxFd2hQY0dWdWRHVnpkREVmTUIwR0ExVUVBeE1XUlZCVElFNXZiaTF5WlhCMVpHbGhkR2x2YmlCRFFUQWVGdzB5Ck1qQXlNVGN4TmpReU1ERmFGdzB5TkRBeU1UY3hOalF5TURGYU1Ec3hEakFNQmdOVkJBb1RCVWhUUTBsRE1Sc3dHUVlEVlFRTEV4SlQKYjJ4MWRHbHZiaUJCYzNOMWNtRnVZMlV4RERBS0JnTlZCQU1UQTBWTlZUQ0NBU0l3RFFZSktvWklodmNOQVFFQkJRQURnZ0VQQURDQwpBUW9DZ2dFQkFLMlJ3TThnV3pSM2pOemRwdG4vMVlTc3BzdTlLV0pna0RnbVh6c1VQcWZGTzJ1RTFYTmxjVkg5RzVzUjcyUXJCN2lmCndMc0JEbGhBZTJFQXB6UDBhR0l0eng4d3d0RGhPeFc0VXYxdHBhb0NvY0Q3bG9kL0F1MmZ3K2hiMm9jRExEUVNXTmk5Z29zdytGMGUKTlc5TmdhRG00SGs2OWZQQUhCK2Y3TGNkWHUxUUMzdUpHM0EvdW13VCs5MU9qYllhRFBZSWNUTlhQUml6TWtySjNsb0xJTldnSUQ2QwpuMmZLQjdYbHhMTHp4NlQzUHVTMEtxbXFRUitJWDBuWWI3N1VxRVRZenFRcGZSY1RXNXMxSVhoZVBLUUxkdWVkMnBBdm5hcVN6UE1hCnpQbExmQ0tpcE95YnpadktScUxvVmVtMzlwRHZpMWVrVW1tS2RTU0o4VWJUTjZrQ0F3RUFBYU9CMkRDQjFUQUpCZ05WSFJNRUFqQUEKTUN3R0NXQ0dTQUdHK0VJQkRRUWZGaDFQY0dWdVUxTk1JRWRsYm1WeVlYUmxaQ0JEWlhKMGFXWnBZMkYwWlRBZEJnTlZIUTRFRmdRVQpNWjVJeUNqU3ZlOHJ3QVRocFFndGFMc0xsZ2N3ZXdZRFZSMGpCSFF3Y29BVTBoRzlmMmlhdVh0bGRLb1FnM0xyRGFzOUIyNmhUNlJOCk1Fc3hGREFTQmdOVkJBb1RDMDVJVXlCRWFXZHBkR0ZzTVJFd0R3WURWUVFMRXdoUGNHVnVkR1Z6ZERFZ01CNEdBMVVFQXhNWFQzQmwKYm5SbGMzUWdVbTl2ZENCQmRYUm9iM0pwZEhtQ0NRRHE3Unhkc3VvcWhEQU5CZ2txaGtpRzl3MEJBUXNGQUFPQ0FRRUExaWlmcFRIZQpZbmhtVDZMeFhpeThiUmZYTDRZU0pRQjlvVGNMb21ia2pMb2ZTMk5EajRjYThQTFRVMmttVzRVbGpmYVVGWXlPZUx4UW95VWtBZmdFCnZWeEhoNmxWbGg0aDlVM2ZhWEE3MkxTWWcyQ1BmcUdabmNRZkVrOWwzWkNpY0Y5WWdXOHJOdlhhVE9KVEVOTFRBVU9TemswaFp1M3UKYTVUY1A1MW8rNFBWT2dQaFlJby9HQ3J6anBrS1hMNDY1RGk1VU14cHUzYWc2V3AxRENJL1g0YkVKWiswSWR3QlBTOTBDNFlCYTNXdQpMRmJaQmtBQ1JtRi9vNFRNdVl4cFVRaTgwbkFoNGkxVXBFY2RheDdzd2Zpa1BpOHhqdmdSZkVtSmRJenBoeitsVkNLaGRGSTcyNUdHCllsc09HckUybytjaDdHbU9jOHcxLzhyVjgxQVVkUT09PC9YNTA5Q2VydGlmaWNhdGU+PC9YNTA5RGF0YT48L0tleUluZm8+PC9TaWduYXR1cmU+",
            "type": [
              {
                "code": "1.2.840.10065.1.12.1.1",
                "system": "urn:iso-astm:E1762-95:2013"
              }
            ]
          }
        ],
        "target": [
          {
            "reference": "urn:uuid:88957687-18ab-462b-a6a9-ccae365adc5a"
          },
          {
            "reference": "urn:uuid:5c3cb347-9aac-41e7-a311-5acfe2f2436d"
          },
          {
            "reference": "urn:uuid:03c47751-3bc6-45c4-a13b-bf0728d45eea"
          },
          {
            "reference": "urn:uuid:9f1e815c-13a6-4b44-9252-170ee56a9ba6"
          },
          {
            "reference": "urn:uuid:5dcd1a40-d045-4221-b27f-30e4ec5375dc"
          },
          {
            "reference": "urn:uuid:79b5ecba-6bf5-47c8-9e6f-b59e3a00c3dd"
          },
          {
            "reference": "urn:uuid:69e6226e-6d98-4600-9735-5e38d4917169"
          },
          {
            "reference": "urn:uuid:e091d3b1-9638-4acb-85a4-fd4bd1fad5d5"
          }
        ]
      }
    }
  ]
} as unknown as fhir.Bundle

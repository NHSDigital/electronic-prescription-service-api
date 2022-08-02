import * as uuid from "uuid"
import {basePath, pactOptions} from "../../resources/common"
import {InteractionObject} from "@pact-foundation/pact"
import {Pact} from '@pact-foundation/pact'

const provider = new Pact(pactOptions("sandbox", "verify-signature"))

test('verify-signature e2e tests', async () => {
  provider.setup().then(async () => {
/* eslint-disable max-len */
const request = JSON.stringify({
  "resourceType": "Bundle",
  "id": "0d03bd39-65f7-4483-a67d-c581adf72429",
  "meta": {
    "lastUpdated": "2022-08-02T14:58:53+00:00"
  },
  "identifier": {
    "system": "https://tools.ietf.org/html/rfc4122",
    "value": "9ca53b31-bd62-41d3-acd2-b518d38e0420"
  },
  "type": "searchset",
  "total": 1,
  "entry": [
    {
      "fullUrl": "urn:uuid:5d62c092-c68c-463a-9084-0e6c36df486f",
      "resource": {
        "resourceType": "Bundle",
        "id": "5d62c092-c68c-463a-9084-0e6c36df486f",
        "meta": {
          "lastUpdated": "2022-08-02T00:00:00+00:00"
        },
        "identifier": {
          "system": "https://tools.ietf.org/html/rfc4122",
          "value": "c4e694e1-a95b-4aca-8808-1034fc1647d2"
        },
        "type": "message",
        "entry": [
          {
            "fullUrl": "urn:uuid:86db212c-5029-42bf-975f-d9de6307067e",
            "resource": {
              "resourceType": "MessageHeader",
              "id": "86db212c-5029-42bf-975f-d9de6307067e",
              "extension": [
                {
                  "url": "https://fhir.nhs.uk/StructureDefinition/Extension-Spine-MessageHeader-messageId",
                  "valueIdentifier": {
                    "system": "https://tools.ietf.org/html/rfc4122",
                    "value": "c4e694e1-a95b-4aca-8808-1034fc1647d2"
                  }
                }
              ],
              "eventCoding": {
                "system": "https://fhir.nhs.uk/CodeSystem/message-event",
                "code": "prescription-order",
                "display": "Prescription Order"
              },
              "destination": [
                {
                  "endpoint": "urn:nhs-uk:addressing:ods:FCG71",
                  "receiver": {
                    "identifier": {
                      "system": "https://fhir.nhs.uk/Id/ods-organization-code",
                      "value": "FCG71"
                    }
                  }
                }
              ],
              "sender": {
                "identifier": {
                  "system": "https://fhir.nhs.uk/Id/ods-organization-code",
                  "value": "X2601"
                },
                "display": "NHS Digital Spine"
              },
              "source": {
                "name": "NHS Spine",
                "endpoint": "https://internal-dev.api.service.nhs.uk/electronic-prescriptions-pr-refs_heads_AEA-2361_compare_prescriptions_during_verification/$process-message"
              },
              "response": {
                "identifier": "3c10d06a-314a-4119-90e3-ec18698727e3",
                "code": "ok"
              },
              "focus": [
                {
                  "reference": "urn:uuid:ef8a1c4d-35c8-4bda-a2fc-194feec316ef"
                },
                {
                  "reference": "urn:uuid:75b19eb4-e6b5-4de5-ad49-465760aa4f17"
                },
                {
                  "reference": "urn:uuid:ccfecb0a-b4a8-446f-a11e-4e48e8f6f826"
                }
              ]
            }
          },
          {
            "fullUrl": "urn:uuid:75b19eb4-e6b5-4de5-ad49-465760aa4f17",
            "resource": {
              "resourceType": "MedicationRequest",
              "id": "75b19eb4-e6b5-4de5-ad49-465760aa4f17",
              "extension": [
                {
                  "url": "https://fhir.nhs.uk/StructureDefinition/Extension-DM-ResponsiblePractitioner",
                  "valueReference": {
                    "reference": "urn:uuid:b8f2a5c2-3700-42c2-ace7-c4915e696e0d"
                  }
                },
                {
                  "url": "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionType",
                  "valueCoding": {
                    "system": "https://fhir.nhs.uk/CodeSystem/prescription-type",
                    "code": "0101"
                  }
                }
              ],
              "identifier": [
                {
                  "system": "https://fhir.nhs.uk/Id/prescription-order-item-number",
                  "value": "3a6fde69-84c2-45ea-bc06-4d3b48658bd7"
                }
              ],
              "status": "active",
              "intent": "order",
              "medicationCodeableConcept": {
                "coding": [
                  {
                    "system": "http://snomed.info/sct",
                    "code": "39720311000001101",
                    "display": "Paracetamol 500mg soluble tablets"
                  }
                ]
              },
              "subject": {
                "reference": "urn:uuid:ef8a1c4d-35c8-4bda-a2fc-194feec316ef"
              },
              "authoredOn": "2022-08-02T14:58:15+00:00",
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
                "reference": "urn:uuid:b8f2a5c2-3700-42c2-ace7-c4915e696e0d"
              },
              "groupIdentifier": {
                "system": "https://fhir.nhs.uk/Id/prescription-order-number",
                "value": "F42132-A83008-F6C1ET",
                "extension": [
                  {
                    "url": "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionId",
                    "valueIdentifier": {
                      "system": "https://fhir.nhs.uk/Id/prescription",
                      "value": "db41568c-b863-4a6b-a051-f8f1f8bc219a"
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
                  "text": "4 times a day - Oral"
                }
              ],
              "dispenseRequest": {
                "extension": [
                  {
                    "url": "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PerformerSiteType",
                    "valueCoding": {
                      "system": "https://fhir.nhs.uk/CodeSystem/dispensing-site-preference",
                      "code": "P1"
                    }
                  }
                ],
                "numberOfRepeatsAllowed": 0,
                "quantity": {
                  "value": 60,
                  "unit": "tablet",
                  "system": "http://snomed.info/sct",
                  "code": "428673006"
                },
                "performer": {
                  "identifier": {
                    "system": "https://fhir.nhs.uk/Id/ods-organization-code",
                    "value": "FCG71"
                  }
                }
              },
              "substitution": {
                "allowedBoolean": false
              }
            }
          },
          {
            "fullUrl": "urn:uuid:ccfecb0a-b4a8-446f-a11e-4e48e8f6f826",
            "resource": {
              "resourceType": "MedicationRequest",
              "id": "ccfecb0a-b4a8-446f-a11e-4e48e8f6f826",
              "extension": [
                {
                  "url": "https://fhir.nhs.uk/StructureDefinition/Extension-DM-ResponsiblePractitioner",
                  "valueReference": {
                    "reference": "urn:uuid:b8f2a5c2-3700-42c2-ace7-c4915e696e0d"
                  }
                },
                {
                  "url": "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionType",
                  "valueCoding": {
                    "system": "https://fhir.nhs.uk/CodeSystem/prescription-type",
                    "code": "0101"
                  }
                }
              ],
              "identifier": [
                {
                  "system": "https://fhir.nhs.uk/Id/prescription-order-item-number",
                  "value": "9408c1c7-a6ea-416c-b4df-cd8e755fc586"
                }
              ],
              "status": "active",
              "intent": "order",
              "medicationCodeableConcept": {
                "coding": [
                  {
                    "system": "http://snomed.info/sct",
                    "code": "39113611000001102",
                    "display": "Salbutamol 100micrograms/dose inhaler CFC free"
                  }
                ]
              },
              "subject": {
                "reference": "urn:uuid:ef8a1c4d-35c8-4bda-a2fc-194feec316ef"
              },
              "authoredOn": "2022-08-02T14:58:15+00:00",
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
                "reference": "urn:uuid:b8f2a5c2-3700-42c2-ace7-c4915e696e0d"
              },
              "groupIdentifier": {
                "system": "https://fhir.nhs.uk/Id/prescription-order-number",
                "value": "F42132-A83008-F6C1ET",
                "extension": [
                  {
                    "url": "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionId",
                    "valueIdentifier": {
                      "system": "https://fhir.nhs.uk/Id/prescription",
                      "value": "db41568c-b863-4a6b-a051-f8f1f8bc219a"
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
                  "text": "5 times a day - Inhalation"
                }
              ],
              "dispenseRequest": {
                "extension": [
                  {
                    "url": "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PerformerSiteType",
                    "valueCoding": {
                      "system": "https://fhir.nhs.uk/CodeSystem/dispensing-site-preference",
                      "code": "P1"
                    }
                  }
                ],
                "numberOfRepeatsAllowed": 0,
                "quantity": {
                  "value": 200,
                  "unit": "dose",
                  "system": "http://snomed.info/sct",
                  "code": "3317411000001100"
                },
                "performer": {
                  "identifier": {
                    "system": "https://fhir.nhs.uk/Id/ods-organization-code",
                    "value": "FCG71"
                  }
                }
              },
              "substitution": {
                "allowedBoolean": false
              }
            }
          },
          {
            "fullUrl": "urn:uuid:ef8a1c4d-35c8-4bda-a2fc-194feec316ef",
            "resource": {
              "resourceType": "Patient",
              "id": "ef8a1c4d-35c8-4bda-a2fc-194feec316ef",
              "identifier": [
                {
                  "system": "https://fhir.nhs.uk/Id/nhs-number",
                  "value": "9449304130"
                }
              ],
              "name": [
                {
                  "use": "usual",
                  "family": "TWITCHETT",
                  "given": [
                    "STACEY",
                    "MARISA"
                  ],
                  "prefix": [
                    "MS"
                  ]
                }
              ],
              "gender": "female",
              "birthDate": "1948-04-30",
              "address": [
                {
                  "use": "home",
                  "line": [
                    "10 HEATHFIELD",
                    "COBHAM",
                    "SURREY"
                  ],
                  "postalCode": "KT11 2QY"
                }
              ],
              "generalPractitioner": [
                {
                  "identifier": {
                    "system": "https://fhir.nhs.uk/Id/ods-organization-code",
                    "value": "A83008"
                  }
                }
              ]
            }
          },
          {
            "fullUrl": "urn:uuid:8724d779-c9a2-4f3b-ac06-171cc4b469ff",
            "resource": {
              "resourceType": "Practitioner",
              "id": "8724d779-c9a2-4f3b-ac06-171cc4b469ff",
              "identifier": [
                {
                  "system": "https://fhir.hl7.org.uk/Id/gphc-number",
                  "value": "6095103"
                },
                {
                  "system": "https://fhir.hl7.org.uk/Id/din-number",
                  "value": "977677"
                }
              ],
              "name": [
                {
                  "family": "BOIN",
                  "given": [
                    "C"
                  ],
                  "prefix": [
                    "DR"
                  ]
                }
              ]
            }
          },
          {
            "fullUrl": "urn:uuid:b8f2a5c2-3700-42c2-ace7-c4915e696e0d",
            "resource": {
              "resourceType": "PractitionerRole",
              "id": "b8f2a5c2-3700-42c2-ace7-c4915e696e0d",
              "identifier": [
                {
                  "system": "https://fhir.nhs.uk/Id/sds-role-profile-id",
                  "value": "200102238987"
                }
              ],
              "practitioner": {
                "reference": "urn:uuid:8724d779-c9a2-4f3b-ac06-171cc4b469ff"
              },
              "code": [
                {
                  "coding": [
                    {
                      "system": "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
                      "code": "R8000",
                      "display": "R8000"
                    }
                  ]
                }
              ],
              "telecom": [
                {
                  "system": "phone",
                  "use": "work",
                  "value": "01234567890"
                }
              ],
              "organization": {
                "reference": "urn:uuid:da603b5f-e980-4913-a17a-fd382f1dab87"
              }
            }
          },
          {
            "fullUrl": "urn:uuid:da603b5f-e980-4913-a17a-fd382f1dab87",
            "resource": {
              "resourceType": "Organization",
              "id": "da603b5f-e980-4913-a17a-fd382f1dab87",
              "identifier": [
                {
                  "system": "https://fhir.nhs.uk/Id/ods-organization-code",
                  "value": "A83008"
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
              "name": "HALLGARTH SURGERY",
              "telecom": [
                {
                  "system": "phone",
                  "use": "work",
                  "value": "01159737320"
                }
              ],
              "address": [
                {
                  "use": "work",
                  "line": [
                    "HALLGARTH SURGERY",
                    "CHEAPSIDE",
                    "SHILDON",
                    "COUNTY DURHAM"
                  ],
                  "postalCode": "DL4 2HP"
                }
              ],
              "partOf": {
                "identifier": {
                  "system": "https://fhir.nhs.uk/Id/ods-organization-code",
                  "value": "84H"
                },
                "display": "NHS COUNTY DURHAM CCG"
              }
            }
          },
          {
            "fullUrl": "urn:uuid:de566e25-b2d5-4a02-b2a6-86ba57d5b384",
            "resource": {
              "resourceType": "Provenance",
              "id": "de566e25-b2d5-4a02-b2a6-86ba57d5b384",
              "agent": [
                {
                  "who": {
                    "reference": "urn:uuid:b8f2a5c2-3700-42c2-ace7-c4915e696e0d"
                  }
                }
              ],
              "recorded": "2022-08-02T14:58:15+00:00",
              "signature": [
                {
                  "who": {
                    "reference": "urn:uuid:b8f2a5c2-3700-42c2-ace7-c4915e696e0d"
                  },
                  "when": "2022-08-02T14:58:15+00:00",
                  "data": "PFNpZ25hdHVyZSB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC8wOS94bWxkc2lnIyI+PFNpZ25lZEluZm8+PENhbm9uaWNhbGl6YXRpb25NZXRob2QgQWxnb3JpdGhtPSJodHRwOi8vd3d3LnczLm9yZy8yMDAxLzEwL3htbC1leGMtYzE0biMiPjwvQ2Fub25pY2FsaXphdGlvbk1ldGhvZD48U2lnbmF0dXJlTWV0aG9kIEFsZ29yaXRobT0iaHR0cDovL3d3dy53My5vcmcvMjAwMC8wOS94bWxkc2lnI3JzYS1zaGExIj48L1NpZ25hdHVyZU1ldGhvZD48UmVmZXJlbmNlPjxUcmFuc2Zvcm1zPjxUcmFuc2Zvcm0gQWxnb3JpdGhtPSJodHRwOi8vd3d3LnczLm9yZy8yMDAxLzEwL3htbC1leGMtYzE0biMiPjwvVHJhbnNmb3JtPjwvVHJhbnNmb3Jtcz48RGlnZXN0TWV0aG9kIEFsZ29yaXRobT0iaHR0cDovL3d3dy53My5vcmcvMjAwMC8wOS94bWxkc2lnI3NoYTEiPjwvRGlnZXN0TWV0aG9kPjxEaWdlc3RWYWx1ZT5BZ3VuazgyRTdJT3dGRkRIOGpuSDVqWXRsYXM9PC9EaWdlc3RWYWx1ZT48L1JlZmVyZW5jZT48L1NpZ25lZEluZm8+PFNpZ25hdHVyZVZhbHVlPmpnQ05BU29yc2VJK2pGbTdPaVowNDl0d1RTYlJFYWF4M3hKaGpIcmtPZzIwdnhnSGRKaWRkTGJ5ZS9CV1FIVGxaUDBEendDbUhENmhwd3AyZ1JGV09GTEhpaGljbnM4TDJJcnl2WWpLV09PYStyNjAwY2x5S3hRQWxlSVNzMGJieUNEZWxMQkhBeGJ2Z2ttb3ZzNmRTKzFBTFpveWl6bEYwRHJ1ME55M1F1Yz08L1NpZ25hdHVyZVZhbHVlPjxLZXlJbmZvPjxYNTA5RGF0YT48WDUwOUNlcnRpZmljYXRlPk1JSUR1RENDQXFDZ0F3SUJBZ0lFWGNtdEh6QU5CZ2txaGtpRzl3MEJBUXNGQURBMk1Rd3dDZ1lEVlFRS0V3TnVhSE14Q3pBSkJnTlZCQXNUQWtOQk1Sa3dGd1lEVlFRREV4Qk9TRk1nU1U1VUlFeGxkbVZzSURGRU1CNFhEVEl3TVRBeU1qRXdNakUxTlZvWERUSXlNVEF5TWpFd05URTFOVm93UXpFTU1Bb0dBMVVFQ2hNRGJtaHpNUTh3RFFZRFZRUUxFd1pRWlc5d2JHVXhJakFnQmdOVkJBTU1HVFUxTlRJMU16VXlNVEV3T0Y5U1FVNUVUMDFmVlZORlVsRXdnWjh3RFFZSktvWklodmNOQVFFQkJRQURnWTBBTUlHSkFvR0JBS3Q0c3pOdzdPQUg3QVFSckRlL3hCSW1zTW1NaVM5RXNyVDNhM3AvTGgzYnJkekk5YWFqVFVaMmIvY3ZiT2E3UGVZZDd1K0s0YTJaZDBYayswR0ZtWUd6U1ZYNmlZamJsd3IwdmFpMzF6VjdHK2xHdkh4SDZwU29MQ3dJQ2FaQUZ3YWJlRDVPejk0K3lBM2FXTld0R1YwRGZoOXF3SDNaRkNJTVJzdmVyTjFwQWdNQkFBR2pnZ0ZETUlJQlB6QU9CZ05WSFE4QkFmOEVCQU1DQmtBd1pRWURWUjBnQVFIL0JGc3dXVEJYQmdzcWhqb0FpWHRtQUFNQ0FEQklNRVlHQ0NzR0FRVUZCd0lCRmpwb2RIUndjem92TDNCcmFTNXVhSE11ZFdzdlkyVnlkR2xtYVdOaGRHVmZjRzlzYVdOcFpYTXZZMjl1ZEdWdWRGOWpiMjF0YVhSdFpXNTBNRE1HQTFVZEh3UXNNQ293S0tBbW9DU0dJbWgwZEhBNkx5OWpjbXd1Ym1oekxuVnJMMmx1ZEM4eFpDOWpjbXhqTXk1amNtd3dLd1lEVlIwUUJDUXdJb0FQTWpBeU1ERXdNakl4TURJeE5UVmFnUTh5TURJeU1ETXhOekV3TlRFMU5Wb3dId1lEVlIwakJCZ3dGb0FVb0pZZmdZVE5QZDZFVUtMNlFMSXpIeFk1UEZJd0hRWURWUjBPQkJZRUZMdHl2WVN5YXFnNjBBRVVaZ3hrMHdyalJKYytNQWtHQTFVZEV3UUNNQUF3R1FZSktvWklodlo5QjBFQUJBd3dDaHNFVmpndU13TUNCTEF3RFFZSktvWklodmNOQVFFTEJRQURnZ0VCQUJjenk4QjhqdVBwSWZhVE5GY3hyQzIyYUNYL3hZWm1ockwvTnZJQkFhWDFHNWhqaXdta0dLRTJoUlRJcjY3UHhaeG1Yc0p4aWdSQk1IUGxJK2xZLytva3pIMEdpN2I1YnFsdzdweEdJZ0pPMDAwdzhwRnN2bzl3NDJJWWhIb2Rzdm5EVlN4aE1UMEo0NlFoazlzb0UwTGpvRVVMS1FQUGxZR2tlL0dsM20xN0l0Rll3T2JRSDBmTUV3bWlxQnllSWZ6N2dTY2NPekw1Y0lwNlBjWlRPam8ySXFRcGdFbWhqT2NSSW5FcUFOaXRTZGpvaUpBSnpwYWFaallUUmRIVVg3aTdhakVpSDRtOTFuRlcrNEFxa050dGxiNFdjR0tzU21XZ2ZLS2hlRjRJb1pLTUU4MHhlclNnTXk4dnRqTE9CSkNHWHowd0xHbVF1Um14TVRxODhxND08L1g1MDlDZXJ0aWZpY2F0ZT48L1g1MDlEYXRhPjwvS2V5SW5mbz48L1NpZ25hdHVyZT4=",
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
                  "reference": "urn:uuid:86db212c-5029-42bf-975f-d9de6307067e"
                },
                {
                  "reference": "urn:uuid:ef8a1c4d-35c8-4bda-a2fc-194feec316ef"
                },
                {
                  "reference": "urn:uuid:b8f2a5c2-3700-42c2-ace7-c4915e696e0d"
                },
                {
                  "reference": "urn:uuid:8724d779-c9a2-4f3b-ac06-171cc4b469ff"
                },
                {
                  "reference": "urn:uuid:da603b5f-e980-4913-a17a-fd382f1dab87"
                },
                {
                  "reference": "urn:uuid:75b19eb4-e6b5-4de5-ad49-465760aa4f17"
                },
                {
                  "reference": "urn:uuid:ccfecb0a-b4a8-446f-a11e-4e48e8f6f826"
                }
              ]
            }
          }
        ]
      }
    }
  ]
})
/* eslint-enable max-len */
    const apiPath = `${basePath}/$verify-signature`
    const requestId = uuid.v4()
    const correlationId = uuid.v4()

    const interaction: InteractionObject = {
      state: undefined,
      uponReceiving: "a valid FHIR message",
      withRequest: {
        headers: {
          "Content-Type": "application/fhir+json; fhirVersion=4.0",
          "X-Request-ID": requestId,
          "X-Correlation-ID": correlationId,
          "X-Skip-Validation": "true"
        },
        method: "POST",
        path: apiPath,
        body: request
      },
      willRespondWith: {
        headers: {
          "Content-Type": "application/json"
        },
        status: 200
      }
    }

    await provider.addInteraction(interaction)
    await provider.writePact()
  })
})

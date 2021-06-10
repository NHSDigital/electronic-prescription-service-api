import Hapi from "@hapi/hapi"
import {
  BASE_PATH,
  ContentTypes
} from "../util"
import {RequestHeaders} from "../../services/headers"
import {unauthorisedActionIssue} from "../../../../models/errors/validation-errors"

export default [
  /*
      Get FHIR prescriptions for an ODS Code
    */
  {
    method: "GET",
    path: `${BASE_PATH}/Tracker/prescriptions/{odsCode}`,
    handler:
      (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Hapi.ResponseObject => {
        if (!request.headers[RequestHeaders.AUTH_LEVEL].includes("user")) {
          return responseToolkit
            .response(unauthorisedActionIssue)
            .code(400)
            .type(ContentTypes.FHIR)
        }

        // 1. Validate odsCode
        // 2. RBAC for user, reject if user not authorised
        // 3. Lookup Hl7v3 prescriptions for ODS code
        // 4. Translate HL7v3 prescriptions to FHIR bundle of bundles
        // 5. Replace response below with above translated FHIR prescriptions

        return responseToolkit
          /* eslint-disable max-len */
          .response({
            "resourceType": "Bundle",
            "id": "a00648e4-6485-4ee5-8133-fc66775615e9",
            "meta": {
              "lastUpdated": "2013-12-10T17:22:07+00:00"
            },
            "identifier": {
              "system": "https://tools.ietf.org/html/rfc4122",
              "value": "285e5cce-8bc8-a7be-6b05-675051da69b0"
            },
            "type": "searchset",
            "total": 1,
            "entry": [
              {
                "resource": {
                  "resourceType": "Bundle",
                  "id": "45a7e202-aab3-4e3f-8b9c-162191b40488",
                  "meta": {
                    "lastUpdated": "2013-11-21T12:11:00+00:00"
                  },
                  "identifier": {
                    "system": "https://tools.ietf.org/html/rfc4122",
                    "value": "83df678d-daa5-1a24-9776-14806d837ca7"
                  },
                  "type": "message",
                  "entry": [
                    {
                      "resource": {
                        "resourceType": "MessageHeader",
                        "id": "95d7e2d0-04e3-409e-83c3-b1c34e1f6d89",
                        "extension": [
                          {
                            "url": "https://fhir.nhs.uk/StructureDefinition/Extension-Spine-MessageHeader-messageId",
                            "valueIdentifier": {
                              "system": "https://tools.ietf.org/html/rfc4122",
                              "value": "83df678d-daa5-1a24-9776-14806d837ca7"
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
                            "endpoint": "urn:nhs-uk:addressing:ods:" + request.params.odsCode,
                            "receiver": {
                              "identifier": {
                                "system": "https://fhir.nhs.uk/Id/ods-organization-code",
                                "value": request.params.odsCode
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
                          "endpoint": "https://internal-dev-sandbox.api.service.nhs.uk/electronic-prescriptions-pr-490/$process-message"
                        },
                        "response": {
                          "identifier": "ebaf4a14-3350-322c-e040-950ae0731b49",
                          "code": "ok"
                        },
                        "focus": [
                          {
                            "reference": "urn:uuid:475f7672-a2cf-4589-9ba0-03cb2e09d695"
                          },
                          {
                            "reference": "urn:uuid:94f02889-6930-4ecd-902e-a47ac0e4c5d1"
                          },
                          {
                            "reference": "urn:uuid:f4fbd0ed-1ff1-4ebe-bb83-aed0d24ddccf"
                          },
                          {
                            "reference": "urn:uuid:201b59f6-595e-40f9-a322-f3e32b8073b4"
                          },
                          {
                            "reference": "urn:uuid:933daffb-615e-4777-81d8-609e6e048b86"
                          }
                        ]
                      },
                      "fullUrl": "urn:uuid:95d7e2d0-04e3-409e-83c3-b1c34e1f6d89"
                    },
                    {
                      "resource": {
                        "resourceType": "Patient",
                        "id": "475f7672-a2cf-4589-9ba0-03cb2e09d695",
                        "identifier": [
                          {
                            "extension": [
                              {
                                "url": "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-NHSNumberVerificationStatus",
                                "valueCodeableConcept": {
                                  "coding": [
                                    {
                                      "system": "https://fhir.hl7.org.uk/CodeSystem/UKCore-NHSNumberVerificationStatus",
                                      "code": "01",
                                      "display": "Number present and verified"
                                    }
                                  ]
                                }
                              }
                            ],
                            "system": "https://fhir.nhs.uk/Id/nhs-number",
                            "value": "9446362962"
                          }
                        ],
                        "name": [
                          {
                            "given": [
                              "BYSSHE",
                              "WILLIS"
                            ],
                            "prefix": [
                              "MR"
                            ],
                            "use": "usual",
                            "family": "BATTERSBY"
                          }
                        ],
                        "gender": "male",
                        "birthDate": "1974-07-29",
                        "address": [
                          {
                            "line": [
                              "10 WARDEN CLOSE",
                              "STOCKTON-ON-TEES",
                              "CLEVELAND"
                            ],
                            "postalCode": "TS19 8LN",
                            "use": "home"
                          }
                        ],
                        "generalPractitioner": [
                          {
                            "identifier": {
                              "system": "https://fhir.nhs.uk/Id/ods-organization-code",
                              "value": "B83002"
                            }
                          }
                        ]
                      },
                      "fullUrl": "urn:uuid:475f7672-a2cf-4589-9ba0-03cb2e09d695"
                    },
                    {
                      "resource": {
                        "resourceType": "Practitioner",
                        "id": "6c8d24f1-b9f9-4a4d-81aa-78697536c59b",
                        "identifier": [
                          {
                            "system": "https://fhir.hl7.org.uk/Id/professional-code",
                            "value": "3308000"
                          }
                        ],
                        "name": [
                          {
                            "text": "RAWLING"
                          }
                        ]
                      },
                      "fullUrl": "urn:uuid:6c8d24f1-b9f9-4a4d-81aa-78697536c59b"
                    },
                    {
                      "resource": {
                        "resourceType": "Location",
                        "id": "658f8b9b-a649-4d87-88f8-d6edbc3fe67b",
                        "address": {
                          "line": [
                            "SPRINGS LANE",
                            "ILKLEY",
                            "WEST YORKSHIRE"
                          ],
                          "postalCode": "LS29 8TH",
                          "use": "work"
                        }
                      },
                      "fullUrl": "urn:uuid:658f8b9b-a649-4d87-88f8-d6edbc3fe67b"
                    },
                    {
                      "resource": {
                        "resourceType": "HealthcareService",
                        "id": "cdaa52ee-fc05-4c3e-b851-ff2673f6cf13",
                        "identifier": [
                          {
                            "system": "https://fhir.nhs.uk/Id/ods-organization-code",
                            "value": "B83002"
                          }
                        ],
                        "location": [
                          {
                            "reference": "urn:uuid:658f8b9b-a649-4d87-88f8-d6edbc3fe67b"
                          }
                        ],
                        "name": "ILKLEY & WHARFEDALE MEDICAL PRACTICE",
                        "telecom": [
                          {
                            "system": "phone",
                            "value": "01943604455",
                            "use": "work"
                          }
                        ],
                        "providedBy": {
                          "reference": "urn:uuid:d07c3fc7-37c3-498d-b8ff-7763a02d443a"
                        }
                      },
                      "fullUrl": "urn:uuid:cdaa52ee-fc05-4c3e-b851-ff2673f6cf13"
                    },
                    {
                      "resource": {
                        "resourceType": "PractitionerRole",
                        "id": "8eaba94a-e34b-4870-a6a4-64de2bb00434",
                        "identifier": [
                          {
                            "system": "https://fhir.nhs.uk/Id/sds-role-profile-id",
                            "value": "100098448986"
                          }
                        ],
                        "practitioner": {
                          "reference": "urn:uuid:6c8d24f1-b9f9-4a4d-81aa-78697536c59b"
                        },
                        "healthcareService": [
                          {
                            "reference": "urn:uuid:cdaa52ee-fc05-4c3e-b851-ff2673f6cf13"
                          }
                        ],
                        "code": [
                          {
                            "coding": [
                              {
                                "system": "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
                                "code": "R0260",
                                "display": ""
                              }
                            ]
                          }
                        ],
                        "telecom": [
                          {
                            "system": "phone",
                            "value": "01943604455",
                            "use": "work"
                          }
                        ],
                        "organization": {
                          "reference": "urn:uuid:d07c3fc7-37c3-498d-b8ff-7763a02d443a"
                        }
                      },
                      "fullUrl": "urn:uuid:8eaba94a-e34b-4870-a6a4-64de2bb00434"
                    },
                    {
                      "resource": {
                        "resourceType": "Organization",
                        "id": "d07c3fc7-37c3-498d-b8ff-7763a02d443a",
                        "identifier": [
                          {
                            "system": "https://fhir.nhs.uk/Id/ods-organization-code",
                            "value": "5AW"
                          }
                        ],
                        "type": [
                          {
                            "coding": [
                              {
                                "system": "https://fhir.nhs.uk/CodeSystem/organisation-role",
                                "code": "197",
                                "display": "NHS TRUST"
                              }
                            ]
                          }
                        ]
                      },
                      "fullUrl": "urn:uuid:d07c3fc7-37c3-498d-b8ff-7763a02d443a"
                    },
                    {
                      "resource": {
                        "resourceType": "Practitioner",
                        "id": "9d011721-878b-40f2-9dc3-05e04d4bce70",
                        "identifier": [
                          {
                            "system": "https://fhir.hl7.org.uk/Id/din-number",
                            "value": "G33080"
                          }
                        ],
                        "name": [
                          {
                            "text": "RAWLING"
                          }
                        ]
                      },
                      "fullUrl": "urn:uuid:9d011721-878b-40f2-9dc3-05e04d4bce70"
                    },
                    {
                      "resource": {
                        "resourceType": "Location",
                        "id": "f3255208-51e1-4b0d-a3a0-e340192360e3",
                        "address": {
                          "line": [
                            "SPRINGS LANE",
                            "ILKLEY",
                            "WEST YORKSHIRE"
                          ],
                          "postalCode": "LS29 8TH",
                          "use": "work"
                        }
                      },
                      "fullUrl": "urn:uuid:f3255208-51e1-4b0d-a3a0-e340192360e3"
                    },
                    {
                      "resource": {
                        "resourceType": "HealthcareService",
                        "id": "30963e27-9d51-43b1-9834-aa77a80789a3",
                        "identifier": [
                          {
                            "system": "https://fhir.nhs.uk/Id/ods-organization-code",
                            "value": "B83002"
                          }
                        ],
                        "location": [
                          {
                            "reference": "urn:uuid:f3255208-51e1-4b0d-a3a0-e340192360e3"
                          }
                        ],
                        "name": "ILKLEY & WHARFEDALE MEDICAL PRACTICE",
                        "telecom": [
                          {
                            "system": "phone",
                            "value": "01943604455",
                            "use": "work"
                          }
                        ]
                      },
                      "fullUrl": "urn:uuid:30963e27-9d51-43b1-9834-aa77a80789a3"
                    },
                    {
                      "resource": {
                        "resourceType": "PractitionerRole",
                        "id": "9f2a574e-3cf6-4f9a-87b5-49f738a64557",
                        "identifier": [
                          {
                            "system": "https://fhir.nhs.uk/Id/sds-role-profile-id",
                            "value": "100098448986"
                          }
                        ],
                        "practitioner": {
                          "reference": "urn:uuid:9d011721-878b-40f2-9dc3-05e04d4bce70"
                        },
                        "healthcareService": [
                          {
                            "reference": "urn:uuid:30963e27-9d51-43b1-9834-aa77a80789a3"
                          }
                        ],
                        "code": [
                          {
                            "coding": [
                              {
                                "system": "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
                                "code": "R0260",
                                "display": ""
                              }
                            ]
                          }
                        ],
                        "telecom": [
                          {
                            "system": "phone",
                            "value": "01943604455",
                            "use": "work"
                          }
                        ]
                      },
                      "fullUrl": "urn:uuid:9f2a574e-3cf6-4f9a-87b5-49f738a64557"
                    },
                    {
                      "resource": {
                        "resourceType": "MedicationRequest",
                        "id": "94f02889-6930-4ecd-902e-a47ac0e4c5d1",
                        "extension": [
                          {
                            "url": "https://fhir.nhs.uk/StructureDefinition/Extension-DM-ResponsiblePractitioner",
                            "valueReference": {
                              "reference": "urn:uuid:9f2a574e-3cf6-4f9a-87b5-49f738a64557"
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
                            "value": "ebaf4a14-3094-322c-e040-950ae0731b49"
                          }
                        ],
                        "status": "active",
                        "intent": "order",
                        "medicationCodeableConcept": {
                          "coding": [
                            {
                              "system": "http://snomed.info/sct",
                              "code": "10795711000001100",
                              "display": "Diphtheria / Tetanus / Pertussis (acellular component) / Poliomyelitis (inactivated) / Haemophilus type b conjugate vaccine (adsorbed) powder and suspension for suspension for injection 0.5ml pre-filled syringes"
                            }
                          ]
                        },
                        "subject": {
                          "reference": "urn:uuid:475f7672-a2cf-4589-9ba0-03cb2e09d695"
                        },
                        "requester": {
                          "reference": "urn:uuid:8eaba94a-e34b-4870-a6a4-64de2bb00434"
                        },
                        "groupIdentifier": {
                          "system": "https://fhir.nhs.uk/Id/prescription-order-number",
                          "value": "145981-B83002-5ABE9Z",
                          "extension": [
                            {
                              "url": "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionId",
                              "valueIdentifier": {
                                "system": "https://fhir.nhs.uk/Id/prescription",
                                "value": "ebaf4a14-2fed-322c-e040-950ae0731b49"
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
                                "code": "P1"
                              }
                            }
                          ],
                          "quantity": {
                            "value": 1,
                            "unit": "pre-filled disposable injection",
                            "system": "http://snomed.info/sct",
                            "code": "non_dmd_units"
                          },
                          "expectedSupplyDuration": {
                            "unit": "days",
                            "value": 28,
                            "system": "http://unitsofmeasure.org",
                            "code": "d"
                          },
                          "performer": {
                            "identifier": {
                              "system": "https://fhir.nhs.uk/Id/ods-organization-code",
                              "value": request.params.odsCode
                            }
                          }
                        },
                        "substitution": {
                          "allowedBoolean": false
                        }
                      },
                      "fullUrl": "urn:uuid:94f02889-6930-4ecd-902e-a47ac0e4c5d1"
                    },
                    {
                      "resource": {
                        "resourceType": "MedicationRequest",
                        "id": "f4fbd0ed-1ff1-4ebe-bb83-aed0d24ddccf",
                        "extension": [
                          {
                            "url": "https://fhir.nhs.uk/StructureDefinition/Extension-DM-ResponsiblePractitioner",
                            "valueReference": {
                              "reference": "urn:uuid:9f2a574e-3cf6-4f9a-87b5-49f738a64557"
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
                            "value": "ebaf4a14-3099-322c-e040-950ae0731b49"
                          }
                        ],
                        "status": "active",
                        "intent": "order",
                        "medicationCodeableConcept": {
                          "coding": [
                            {
                              "system": "http://snomed.info/sct",
                              "code": "10816511000001101",
                              "display": "Shelter Soft & Secure ileostomy bag with filter, bio dressing resin and microporous adhesive, extra large SS3600/00 Cut to fit 13mm-80mm Beige (Charles S. Bullen Stomacare Ltd)"
                            }
                          ]
                        },
                        "subject": {
                          "reference": "urn:uuid:475f7672-a2cf-4589-9ba0-03cb2e09d695"
                        },
                        "requester": {
                          "reference": "urn:uuid:8eaba94a-e34b-4870-a6a4-64de2bb00434"
                        },
                        "groupIdentifier": {
                          "system": "https://fhir.nhs.uk/Id/prescription-order-number",
                          "value": "145981-B83002-5ABE9Z",
                          "extension": [
                            {
                              "url": "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionId",
                              "valueIdentifier": {
                                "system": "https://fhir.nhs.uk/Id/prescription",
                                "value": "ebaf4a14-2fed-322c-e040-950ae0731b49"
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
                                "code": "P1"
                              }
                            }
                          ],
                          "quantity": {
                            "value": 15,
                            "unit": "device",
                            "system": "http://snomed.info/sct",
                            "code": "3318711000001107"
                          },
                          "expectedSupplyDuration": {
                            "unit": "days",
                            "value": 28,
                            "system": "http://unitsofmeasure.org",
                            "code": "d"
                          },
                          "performer": {
                            "identifier": {
                              "system": "https://fhir.nhs.uk/Id/ods-organization-code",
                              "value": request.params.odsCode
                            }
                          }
                        },
                        "substitution": {
                          "allowedBoolean": false
                        }
                      },
                      "fullUrl": "urn:uuid:f4fbd0ed-1ff1-4ebe-bb83-aed0d24ddccf"
                    },
                    {
                      "resource": {
                        "resourceType": "MedicationRequest",
                        "id": "201b59f6-595e-40f9-a322-f3e32b8073b4",
                        "extension": [
                          {
                            "url": "https://fhir.nhs.uk/StructureDefinition/Extension-DM-ResponsiblePractitioner",
                            "valueReference": {
                              "reference": "urn:uuid:9f2a574e-3cf6-4f9a-87b5-49f738a64557"
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
                            "value": "ebaf4a14-309e-322c-e040-950ae0731b49"
                          }
                        ],
                        "status": "active",
                        "intent": "order",
                        "medicationCodeableConcept": {
                          "coding": [
                            {
                              "system": "http://snomed.info/sct",
                              "code": "7199311000001102",
                              "display": "Urinary all silicone suprapubic catheter with integral balloon and shaped tip long 16Ch 084616101 10ml balloon (L.In.C. (Leicester Integrated Clinical) Medical Systems Ltd)"
                            }
                          ]
                        },
                        "subject": {
                          "reference": "urn:uuid:475f7672-a2cf-4589-9ba0-03cb2e09d695"
                        },
                        "requester": {
                          "reference": "urn:uuid:8eaba94a-e34b-4870-a6a4-64de2bb00434"
                        },
                        "groupIdentifier": {
                          "system": "https://fhir.nhs.uk/Id/prescription-order-number",
                          "value": "145981-B83002-5ABE9Z",
                          "extension": [
                            {
                              "url": "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionId",
                              "valueIdentifier": {
                                "system": "https://fhir.nhs.uk/Id/prescription",
                                "value": "ebaf4a14-2fed-322c-e040-950ae0731b49"
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
                                "code": "P1"
                              }
                            }
                          ],
                          "quantity": {
                            "value": 1,
                            "unit": "catheter",
                            "system": "http://snomed.info/sct",
                            "code": "3319911000001101"
                          },
                          "expectedSupplyDuration": {
                            "unit": "days",
                            "value": 28,
                            "system": "http://unitsofmeasure.org",
                            "code": "d"
                          },
                          "performer": {
                            "identifier": {
                              "system": "https://fhir.nhs.uk/Id/ods-organization-code",
                              "value": request.params.odsCode
                            }
                          }
                        },
                        "substitution": {
                          "allowedBoolean": false
                        }
                      },
                      "fullUrl": "urn:uuid:201b59f6-595e-40f9-a322-f3e32b8073b4"
                    },
                    {
                      "resource": {
                        "resourceType": "MedicationRequest",
                        "id": "933daffb-615e-4777-81d8-609e6e048b86",
                        "extension": [
                          {
                            "url": "https://fhir.nhs.uk/StructureDefinition/Extension-DM-ResponsiblePractitioner",
                            "valueReference": {
                              "reference": "urn:uuid:9f2a574e-3cf6-4f9a-87b5-49f738a64557"
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
                            "value": "ebaf4a14-30a3-322c-e040-950ae0731b49"
                          }
                        ],
                        "status": "active",
                        "intent": "order",
                        "medicationCodeableConcept": {
                          "coding": [
                            {
                              "system": "http://snomed.info/sct",
                              "code": "11416711000001106",
                              "display": "Interferon beta-1a 6million units/0.5ml solution for injection pre-filled syringes and Interferon beta-1a 2.4million units/0.2ml solution for injection pre-filled syringes"
                            }
                          ]
                        },
                        "subject": {
                          "reference": "urn:uuid:475f7672-a2cf-4589-9ba0-03cb2e09d695"
                        },
                        "requester": {
                          "reference": "urn:uuid:8eaba94a-e34b-4870-a6a4-64de2bb00434"
                        },
                        "groupIdentifier": {
                          "system": "https://fhir.nhs.uk/Id/prescription-order-number",
                          "value": "145981-B83002-5ABE9Z",
                          "extension": [
                            {
                              "url": "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionId",
                              "valueIdentifier": {
                                "system": "https://fhir.nhs.uk/Id/prescription",
                                "value": "ebaf4a14-2fed-322c-e040-950ae0731b49"
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
                                "code": "P1"
                              }
                            }
                          ],
                          "quantity": {
                            "value": 12,
                            "unit": "pre-filled disposable injection",
                            "system": "http://snomed.info/sct",
                            "code": "non_dmd_units"
                          },
                          "expectedSupplyDuration": {
                            "unit": "days",
                            "value": 28,
                            "system": "http://unitsofmeasure.org",
                            "code": "d"
                          },
                          "performer": {
                            "identifier": {
                              "system": "https://fhir.nhs.uk/Id/ods-organization-code",
                              "value": request.params.odsCode
                            }
                          }
                        },
                        "substitution": {
                          "allowedBoolean": false
                        }
                      },
                      "fullUrl": "urn:uuid:933daffb-615e-4777-81d8-609e6e048b86"
                    }
                  ]
                },
                "fullUrl": "urn:uuid:45a7e202-aab3-4e3f-8b9c-162191b40488"
              }
            ]
          })
        /* eslint-enable max-len */
          .code(200)
          .type(ContentTypes.FHIR)
      }
  }
]

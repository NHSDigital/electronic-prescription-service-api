export const templateBody = {
  resourceType: "Bundle",
  id: "bb7d8653-9251-4e95-b8a6-f05ca7a35e42",
  identifier: {
    system: "https://tools.ietf.org/html/rfc4122",
    value: "<IDENTIFIER>"
  },
  type: "message",
  entry: [
    {
      fullUrl: "urn:uuid:3e44833d-d99d-434b-acbc-7e23b9003e7e",
      resource: {
        resourceType: "MessageHeader",
        id: "3e44833d-d99d-434b-acbc-7e23b9003e7e",
        destination: [
          {
            endpoint: "urn:nhs-uk:addressing:ods:FCG71",
            receiver: {
              identifier: {
                system: "https://fhir.nhs.uk/Id/ods-organization-code",
                value: "FCG71"
              }
            }
          }
        ],
        sender: {
          identifier: {
            system: "https://fhir.nhs.uk/Id/ods-organization-code",
            value: "X2601"
          },
          display: "NHS Digital Spine"
        },
        source: {
          name: "NHS Spine",
          endpoint:
            "https://internal-dev.api.service.nhs.uk/electronic-prescriptions/$process-message"
        },
        response: {
          code: "ok",
          identifier: "ffffffff-ffff-4fff-bfff-ffffffffffff"
        },
        eventCoding: {
          system: "https://fhir.nhs.uk/CodeSystem/message-event",
          code: "dispense-notification",
          display: "Dispense Notification"
        },
        focus: [
          {
            reference: "urn:uuid:417592b8-e028-40d4-9538-b285e3a561d2"
          },
          {
            reference: "urn:uuid:49329a59-f200-4cf8-a654-24e3ec267ff3"
          },
          {
            reference: "urn:uuid:6fda7e37-d301-44bc-9821-6110e9e67a9c"
          }
        ]
      }
    },
    {
      fullUrl: "urn:uuid:49329a59-f200-4cf8-a654-24e3ec267ff3",
      resource: {
        resourceType: "MedicationDispense",
        id: "49329a59-f200-4cf8-a654-24e3ec267ff3",
        extension: [
          {
            url: "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-TaskBusinessStatus",
            valueCoding: {
              code: "0006",
              system: "https://fhir.nhs.uk/CodeSystem/EPS-task-business-status",
              display: "Dispensed"
            }
          }
        ],
        identifier: [
          {
            system: "https://fhir.nhs.uk/Id/prescription-dispense-item-number",
            value: "13808482-4673-4d49-8bd6-8573a8178c1b"
          }
        ],
        contained: [
          {
            resourceType: "PractitionerRole",
            id: "performer",
            identifier: [
              {
                system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
                value: "555086415105"
              }
            ],
            practitioner: {
              identifier: {
                system: "https://fhir.nhs.uk/Id/sds-user-id",
                value: "3415870201"
              },
              display: "Mr Peter Potion"
            },
            organization: {
              reference: "urn:uuid:2bf9f37c-d88b-4f86-ad5f-373c1416e04b"
            },
            code: [
              {
                coding: [
                  {
                    system:
                      "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
                    code: "R8000",
                    display: "Clinical Practitioner Access Role"
                  }
                ]
              }
            ],
            telecom: [
              {
                system: "phone",
                use: "work",
                value: "0532567890"
              }
            ]
          },
          {
            resourceType: "MedicationRequest",
            id: "m1",
            extension: [
              {
                url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-ResponsiblePractitioner",
                valueReference: {
                  reference: "urn:uuid:74dc6d4b-3237-415a-bc5f-8724d446f61c"
                }
              },
              {
                url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionType",
                valueCoding: {
                  system: "https://fhir.nhs.uk/CodeSystem/prescription-type",
                  code: "0101"
                }
              }
            ],
            identifier: [
              {
                system: "https://fhir.nhs.uk/Id/prescription-order-item-number",
                value: "<ITEM_NUMBER_1>"
              }
            ],
            status: "active",
            intent: "order",
            medicationCodeableConcept: {
              coding: [
                {
                  system: "http://snomed.info/sct",
                  code: "39720311000001101",
                  display: "Paracetamol 500mg soluble tablets"
                }
              ]
            },
            subject: {
              reference: "urn:uuid:932e587e-0426-4899-b0e1-b3ebf317de06"
            },
            authoredOn: "2023-02-22T10:37:43+00:00",
            category: [
              {
                coding: [
                  {
                    system:
                      "http://terminology.hl7.org/CodeSystem/medicationrequest-category",
                    code: "outpatient",
                    display: "Outpatient"
                  }
                ]
              }
            ],
            requester: {
              reference: "urn:uuid:74dc6d4b-3237-415a-bc5f-8724d446f61c"
            },
            groupIdentifier: {
              system: "https://fhir.nhs.uk/Id/prescription-order-number",
              value: "<ORDER_NUMBER>",
              extension: [
                {
                  url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionId",
                  valueIdentifier: {
                    system: "https://fhir.nhs.uk/Id/prescription",
                    value: "affb4acd-5260-4e8e-b46b-5b6097451430"
                  }
                }
              ]
            },
            courseOfTherapyType: {
              coding: [
                {
                  system:
                    "http://terminology.hl7.org/CodeSystem/medicationrequest-course-of-therapy",
                  code: "acute",
                  display: "Short course (acute) therapy"
                }
              ]
            },
            dosageInstruction: [
              {
                text: "4 times a day - Oral"
              }
            ],
            dispenseRequest: {
              extension: [
                {
                  url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PerformerSiteType",
                  valueCoding: {
                    system:
                      "https://fhir.nhs.uk/CodeSystem/dispensing-site-preference",
                    code: "P1"
                  }
                }
              ],
              numberOfRepeatsAllowed: 0,
              quantity: {
                value: 60,
                unit: "tablet",
                system: "http://snomed.info/sct",
                code: "428673006"
              },
              performer: {
                identifier: {
                  system: "https://fhir.nhs.uk/Id/ods-organization-code",
                  value: "FCG71"
                }
              }
            },
            substitution: {
              allowedBoolean: false
            }
          }
        ],
        status: "unknown",
        medicationCodeableConcept: {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "39720311000001101",
              display: "Paracetamol 500mg soluble tablets"
            }
          ]
        },
        subject: {
          reference: "urn:uuid:417592b8-e028-40d4-9538-b285e3a561d2",
          identifier: {
            system: "https://fhir.nhs.uk/Id/nhs-number",
            value: "9449304130"
          }
        },
        performer: [
          {
            actor: {
              reference: "#performer"
            }
          }
        ],
        authorizingPrescription: [
          {
            reference: "#m1"
          }
        ],
        type: {
          coding: [
            {
              code: "0001",
              system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-type",
              display: "Item fully dispensed"
            }
          ]
        },
        quantity: {
          value: 60,
          unit: "tablet",
          system: "http://snomed.info/sct",
          code: "428673006"
        },
        whenHandedOver: "2023-02-22T10:37:53.767Z",
        dosageInstruction: [
          {
            text: "4 times a day - Oral"
          }
        ]
      }
    },
    {
      fullUrl: "urn:uuid:6fda7e37-d301-44bc-9821-6110e9e67a9c",
      resource: {
        resourceType: "MedicationDispense",
        id: "6fda7e37-d301-44bc-9821-6110e9e67a9c",
        extension: [
          {
            url: "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-TaskBusinessStatus",
            valueCoding: {
              code: "0006",
              system: "https://fhir.nhs.uk/CodeSystem/EPS-task-business-status",
              display: "Dispensed"
            }
          }
        ],
        identifier: [
          {
            system: "https://fhir.nhs.uk/Id/prescription-dispense-item-number",
            value: "0f497d6e-03c3-44cc-a0c5-96747bc80013"
          }
        ],
        contained: [
          {
            resourceType: "PractitionerRole",
            id: "performer",
            identifier: [
              {
                system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
                value: "555086415105"
              }
            ],
            practitioner: {
              identifier: {
                system: "https://fhir.nhs.uk/Id/sds-user-id",
                value: "3415870201"
              },
              display: "Mr Peter Potion"
            },
            organization: {
              reference: "urn:uuid:2bf9f37c-d88b-4f86-ad5f-373c1416e04b"
            },
            code: [
              {
                coding: [
                  {
                    system:
                      "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
                    code: "R8000",
                    display: "Clinical Practitioner Access Role"
                  }
                ]
              }
            ],
            telecom: [
              {
                system: "phone",
                use: "work",
                value: "0532567890"
              }
            ]
          },
          {
            resourceType: "MedicationRequest",
            id: "m1",
            extension: [
              {
                url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-ResponsiblePractitioner",
                valueReference: {
                  reference: "urn:uuid:74dc6d4b-3237-415a-bc5f-8724d446f61c"
                }
              },
              {
                url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionType",
                valueCoding: {
                  system: "https://fhir.nhs.uk/CodeSystem/prescription-type",
                  code: "0101"
                }
              }
            ],
            identifier: [
              {
                system: "https://fhir.nhs.uk/Id/prescription-order-item-number",
                value: "<ITEM_NUMBER_2>"
              }
            ],
            status: "active",
            intent: "order",
            medicationCodeableConcept: {
              coding: [
                {
                  system: "http://snomed.info/sct",
                  code: "39113611000001102",
                  display: "Salbutamol 100micrograms/dose inhaler CFC free"
                }
              ]
            },
            subject: {
              reference: "urn:uuid:932e587e-0426-4899-b0e1-b3ebf317de06"
            },
            authoredOn: "2023-02-22T10:37:43+00:00",
            category: [
              {
                coding: [
                  {
                    system:
                      "http://terminology.hl7.org/CodeSystem/medicationrequest-category",
                    code: "outpatient",
                    display: "Outpatient"
                  }
                ]
              }
            ],
            requester: {
              reference: "urn:uuid:74dc6d4b-3237-415a-bc5f-8724d446f61c"
            },
            groupIdentifier: {
              system: "https://fhir.nhs.uk/Id/prescription-order-number",
              value: "<ORDER_NUMBER>",
              extension: [
                {
                  url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionId",
                  valueIdentifier: {
                    system: "https://fhir.nhs.uk/Id/prescription",
                    value: "affb4acd-5260-4e8e-b46b-5b6097451430"
                  }
                }
              ]
            },
            courseOfTherapyType: {
              coding: [
                {
                  system:
                    "http://terminology.hl7.org/CodeSystem/medicationrequest-course-of-therapy",
                  code: "acute",
                  display: "Short course (acute) therapy"
                }
              ]
            },
            dosageInstruction: [
              {
                text: "5 times a day - Inhalation"
              }
            ],
            dispenseRequest: {
              extension: [
                {
                  url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PerformerSiteType",
                  valueCoding: {
                    system:
                      "https://fhir.nhs.uk/CodeSystem/dispensing-site-preference",
                    code: "P1"
                  }
                }
              ],
              numberOfRepeatsAllowed: 0,
              quantity: {
                value: 200,
                unit: "dose",
                system: "http://snomed.info/sct",
                code: "3317411000001100"
              },
              performer: {
                identifier: {
                  system: "https://fhir.nhs.uk/Id/ods-organization-code",
                  value: "FCG71"
                }
              }
            },
            substitution: {
              allowedBoolean: false
            }
          }
        ],
        status: "unknown",
        medicationCodeableConcept: {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "39113611000001102",
              display: "Salbutamol 100micrograms/dose inhaler CFC free"
            }
          ]
        },
        subject: {
          reference: "urn:uuid:417592b8-e028-40d4-9538-b285e3a561d2",
          identifier: {
            system: "https://fhir.nhs.uk/Id/nhs-number",
            value: "9449304130"
          }
        },
        performer: [
          {
            actor: {
              reference: "#performer"
            }
          }
        ],
        authorizingPrescription: [
          {
            reference: "#m1"
          }
        ],
        type: {
          coding: [
            {
              code: "0001",
              system: "https://fhir.nhs.uk/CodeSystem/medicationdispense-type",
              display: "Item fully dispensed"
            }
          ]
        },
        quantity: {
          value: 200,
          unit: "dose",
          system: "http://snomed.info/sct",
          code: "3317411000001100"
        },
        whenHandedOver: "2023-02-22T10:37:53.767Z",
        dosageInstruction: [
          {
            text: "5 times a day - Inhalation"
          }
        ]
      }
    },
    {
      fullUrl: "urn:uuid:417592b8-e028-40d4-9538-b285e3a561d2",
      resource: {
        resourceType: "Patient",
        id: "417592b8-e028-40d4-9538-b285e3a561d2",
        identifier: [
          {
            system: "https://fhir.nhs.uk/Id/nhs-number",
            value: "9449304130"
          }
        ],
        name: [
          {
            use: "usual",
            family: "TWITCHETT",
            given: ["STACEY", "MARISA"],
            prefix: ["MS"]
          }
        ],
        gender: "female",
        birthDate: "1948-04-30",
        address: [
          {
            use: "home",
            line: ["10 HEATHFIELD", "COBHAM", "SURREY"],
            postalCode: "KT11 2QY"
          }
        ],
        generalPractitioner: [
          {
            identifier: {
              system: "https://fhir.nhs.uk/Id/ods-organization-code",
              value: "A83008"
            }
          }
        ]
      }
    },
    {
      fullUrl: "urn:uuid:2bf9f37c-d88b-4f86-ad5f-373c1416e04b",
      resource: {
        resourceType: "Organization",
        extension: [
          {
            url: "https://fhir.nhs.uk/StructureDefinition/Extension-ODS-OrganisationRelationships",
            extension: [
              {
                url: "reimbursementAuthority",
                valueIdentifier: {
                  system: "https://fhir.nhs.uk/Id/ods-organization-code",
                  value: "T1450"
                }
              }
            ]
          }
        ],
        identifier: [
          {
            system: "https://fhir.nhs.uk/Id/ods-organization-code",
            value: "VNE51"
          }
        ],
        id: "2bf9f37c-d88b-4f86-ad5f-373c1416e04b",
        address: [
          {
            city: "West Yorkshire",
            use: "work",
            line: ["17 Austhorpe Road", "Crossgates", "Leeds"],
            postalCode: "LS15 8BA"
          }
        ],
        active: true,
        type: [
          {
            coding: [
              {
                system: "https://fhir.nhs.uk/CodeSystem/organisation-role",
                code: "182",
                display: "PHARMACY"
              }
            ]
          }
        ],
        name: "The Simple Pharmacy",
        telecom: [
          {
            system: "phone",
            use: "work",
            value: "0113 3180277"
          }
        ]
      }
    }
  ]
}

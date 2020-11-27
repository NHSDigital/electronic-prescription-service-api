const messageHeader = {
  "fullUrl": "urn:uuid:4f51f97f-a4b8-4756-bac9-b9bc7af8dc23",
  "resource": {
    "resourceType": "MessageHeader",
    "extension":  [
      {
        "url": "https://fhir.nhs.uk/StructureDefinition/Extension-Spine-MessageHeader-messageId",
        "valueIdentifier": {
          "system": "https://tools.ietf.org/html/rfc4122",
          "value": "49f3405b-b3c9-477a-bd1e-7fba0c84f981"
        }
      },
      {
        "url": "https://fhir.nhs.uk/R4/StructureDefinition/Extension-Spine-Message-Status",
        "valueCoding": {
          "system": "https://fhir.hl7.org.uk/CodeSystem/message-status",
          "code": "active",
          "display": "Active"
        }
      }
    ],
    "eventCoding": {
      "system": "https://fhir.nhs.uk/CodeSystem/message-event",
      "code": "prescription-order-response",
      "display": "Prescription Order Response"
    },
    "destination":  [
      {
        "endpoint": "urn:nhs-uk:addressing:ods:RBA",
        "receiver": {
          "identifier": {
            "system": "https://fhir.nhs.uk/Id/ods-organization-code",
            "value": "RBA"
          },
          "display": "TAUNTON AND SOMERSET NHS FOUNDATION TRUST"
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
      "endpoint": "https://sandbox.api.service.nhs.uk/electronic-prescriptions/$post-message"
    },
    "response": {
      "identifier": "ea50b4a2-0110-4aaa-a3f5-65707e713ae9",
      "code": "ok"
    },
    "focus":  [
      {
        "reference": "urn:uuid:78d3c2eb-009e-4ec8-a358-b042954aa9b2"
      },
      {
        "reference": "urn:uuid:a54219b8-f741-4c47-b662-e4f8dfa49ab6"
      }
    ]
  }
}
const medicationRequest = {
  "fullUrl": "urn:uuid:a54219b8-f741-4c47-b662-e4f8dfa49ab6",
  "resource": {
    "resourceType": "MedicationRequest",
    "extension":  [
      {
        "url": "https://fhir.nhs.uk/R4/StructureDefinition/Extension-DM-PrescriptionStatusHistory",
        "extension":  [
          {
            "url": "status",
            "valueCoding": {
              "system": "https://fhir.nhs.uk/CodeSystem/medicationrequest-status-history",
              "code": "R-0002",
              "display": "Prescription/item was not cancelled – With dispenser"
            }
          }
        ]
      },
      {
        "url": "https://fhir.nhs.uk/R4/StructureDefinition/Extension-DM-ResponsiblePractitioner",
        "valueReference": {
          "reference": "urn:uuid:a5acefc1-f8ca-4989-a5ac-34ae36741466",
          "display": "DR SAZ RAZ"
        }
      }
    ],
    "identifier":  [
      {
        "system": "https://fhir.nhs.uk/Id/prescription-order-item-number",
        "value": "a54219b8-f741-4c47-b662-e4f8dfa49ab6"
      }
    ],
    "status": "active",
    "intent": "order",
    "medicationCodeableConcept": {
      "coding":  [
        {
          "system": "http://snomed.info/sct",
          "code": "763158003",
          "display": "Medicinal product"
        }
      ]
    },
    "subject": {
      "reference": "urn:uuid:78d3c2eb-009e-4ec8-a358-b042954aa9b2",
      "display": "ETTA CORY"
    },
    "authoredOn": "2020-07-13T12:00:00+00:00",
    "requester": {
      "reference": "urn:uuid:56166769-c1c4-4d07-afa8-132b5dfca666",
      "display": "DR RAZIA ALI"
    },
    "groupIdentifier": {
      "system": "https://fhir.nhs.uk/Id/prescription-order-number",
      "value": "DC2C66-A1B2C3-23407B"
    },
    "dispenseRequest": {
      "performer": {
        "extension":  [
          {
            "url": "https://fhir.nhs.uk/R4/StructureDefinition/Extension-DispensingPerformer",
            "valueReference": {
              "reference": "urn:uuid:25f3dd9f-5838-44a7-930e-c78ae3ecadd6",
              "display": "LOTTIE POTTS"
            }
          }
        ],
        "identifier": {
          "system": "https://fhir.nhs.uk/Id/ods-organization-code",
          "value": "VNE51"
        },
        "display": "The Simple Pharmacy"
      }
    }
  }
}
const patient = {
  "fullUrl": "urn:uuid:78d3c2eb-009e-4ec8-a358-b042954aa9b2",
  "resource": {
    "resourceType": "Patient",
    "identifier":  [
      {
        "extension":  [
          {
            "url": "https://fhir.nhs.uk/R4/StructureDefinition/Extension-UKCore-NHSNumberVerificationStatus",
            "valueCodeableConcept": {
              "coding":  [
                {
                  "system": "https://fhir.nhs.uk/R4/CodeSystem/UKCore-NHSNumberVerificationStatus",
                  "code": "01",
                  "display": "Number present and verified"
                }
              ]
            }
          }
        ],
        "system": "https://fhir.nhs.uk/Id/nhs-number",
        "value": "9453740519"
      }
    ],
    "name":  [
      {
        "use": "official",
        "family": "CORY",
        "given":  [
          "ETTA"
        ],
        "prefix":  [
          "MISS"
        ]
      }
    ],
    "gender": "female",
    "birthDate": "1999-01-04",
    "address":  [
      {
        "use": "home",
        "line":  [
          "123 Dale Avenue",
          "Long Eaton",
          "Nottingham"
        ],
        "postalCode": "NG10 1NP"
      }
    ],
    "generalPractitioner":  [
      {
        "identifier": {
          "system": "https://fhir.nhs.uk/Id/ods-organization-code",
          "value": "B81001"
        }
      }
    ]
  }
}
const practitionerRole = {
  "fullUrl": "urn:uuid:56166769-c1c4-4d07-afa8-132b5dfca666",
  "resource": {
    "resourceType": "PractitionerRole",
    "identifier":  [
      {
        "system": "https://fhir.nhs.uk/Id/sds-role-profile-id",
        "value": "100102238986"
      }
    ],
    "practitioner": {
      "reference": "urn:uuid:a8c85454-f8cb-498d-9629-78e2cb5fa47a",
      "display": "DR RAZIA ALI"
    },
    "organization": {
      "reference": "urn:uuid:3b4b03a5-52ba-4ba6-9b82-70350aa109d8",
      "display": "TAUNTON AND SOMERSET NHS FOUNDATION TRUST"
    },
    "code":  [
      {
        "coding":  [
          {
            "system": "https://fhir.nhs.uk/R4/CodeSystem/UKCore-SDSJobRoleName",
            "code": "R8000",
            "display": "Clinical Practitioner Access Role"
          }
        ]
      }
    ],
    "telecom":  [
      {
        "system": "phone",
        "value": "01234567890",
        "use": "work"
      }
    ]
  }
}
const practitioner = {
  "fullUrl": "urn:uuid:a8c85454-f8cb-498d-9629-78e2cb5fa47a",
  "resource": {
    "resourceType": "Practitioner",
    "identifier":  [
      {
        "system": "https://fhir.nhs.uk/Id/sds-user-id",
        "value": "3415870201"
      },
      {
        "system": "https://fhir.hl7.org.uk/Id/gmc-number",
        "value": "G1234567"
      }
    ],
    "name":  [
      {
        "family": "ALI",
        "given":  [
          "RAZIA"
        ],
        "prefix":  [
          "DR"
        ]
      }
    ]
  }
}
const organization = {
  "fullUrl": "urn:uuid:3b4b03a5-52ba-4ba6-9b82-70350aa109d8",
  "resource": {
    "resourceType": "Organization",
    "identifier":  [
      {
        "system": "https://fhir.nhs.uk/Id/ods-organization-code",
        "value": "RBA"
      }
    ],
    "type":  [
      {
        "coding":  [
          {
            "system": "https://fhir.nhs.uk/CodeSystem/organisation-role",
            "code": "RO197",
            "display": "NHS TRUST"
          }
        ]
      }
    ],
    "name": "TAUNTON AND SOMERSET NHS FOUNDATION TRUST",
    "telecom":  [
      {
        "system": "phone",
        "value": "01823333444",
        "use": "work"
      }
    ],
    "address":  [
      {
        "line":  [
          "MUSGROVE PARK HOSPITAL",
          "PARKFIELD DRIVE",
          "TAUNTON"
        ],
        "postalCode": "TA1 5DA"
      }
    ]
  }
}
const practitionerRole2 = {
  "fullUrl": "urn:uuid:25f3dd9f-5838-44a7-930e-c78ae3ecadd6",
  "resource": {
    "resourceType": "PractitionerRole",
    "identifier":  [
      {
        "system": "https://fhir.nhs.uk/Id/sds-role-profile-id",
        "value": "210987654322"
      }
    ],
    "practitioner": {
      "reference": "urn:uuid:b439a0d2-67a8-4045-b577-242c134882db",
      "display": "MS LOTTIE POTTS"
    },
    "organization": {
      "reference": "urn:uuid:a51415a9-99f4-452e-bdae-f4067bfd738a",
      "display": "The Simple Pharmacy"
    },
    "code":  [
      {
        "coding":  [
          {
            "system": "https://fhir.nhs.uk/R4/CodeSystem/UKCore-SDSJobRoleName",
            "code": "R1290",
            "display": "Pharmacist"
          }
        ]
      }
    ],
    "telecom":  [
      {
        "system": "phone",
        "value": "01234567890",
        "use": "work"
      }
    ]
  }
}
const practitioner2 = {
  "fullUrl": "urn:uuid:b439a0d2-67a8-4045-b577-242c134882db",
  "resource": {
    "resourceType": "Practitioner",
    "identifier":  [
      {
        "system": "https://fhir.nhs.uk/Id/sds-user-id",
        "value": "3415870201"
      },
      {
        "system": "https://fhir.hl7.org.uk/Id/gphc-number",
        "value": "2145879"
      }
    ],
    "name":  [
      {
        "family": "POTTS",
        "given":  [
          "LOTTIE"
        ],
        "prefix":  [
          "MS"
        ]
      }
    ]
  }
}
const organization2 = {
  "fullUrl": "urn:uuid:a51415a9-99f4-452e-bdae-f4067bfd738a",
  "resource": {
    "resourceType": "Organization",
    "identifier":  [
      {
        "system": "https://fhir.nhs.uk/Id/ods-organization-code",
        "value": "AB123"
      }
    ],
    "type":  [
      {
        "coding":  [
          {
            "system": "https://fhir.nhs.uk/CodeSystem/organisation-role",
            "code": "RO182",
            "display": "PHARMACY"
          }
        ]
      }
    ],
    "name": "The Simple Pharmacy",
    "telecom":  [
      {
        "system": "phone",
        "value": "01234567890",
        "use": "work"
      }
    ],
    "address":  [
      {
        "line":  [
          "1",
          "The Midway",
          "Simple Town"
        ],
        "postalCode": "AA3 3AA"
      }
    ]
  }
}
const practitionerRole3 = {
  "fullUrl": "urn:uuid:a5acefc1-f8ca-4989-a5ac-34ae36741466",
  "resource": {
    "resourceType": "PractitionerRole",
    "identifier":  [
      {
        "system": "https://fhir.nhs.uk/Id/sds-role-profile-id",
        "value": "10012345678"
      }
    ],
    "practitioner": {
      "reference": "urn:uuid:e6aa1919-1334-4cb2-9024-b3c9bb0415c1",
      "display": "DR SAZ RAZ"
    },
    "organization": {
      "reference": "urn:uuid:3b4b03a5-52ba-4ba6-9b82-70350aa109d8",
      "display": "TAUNTON AND SOMERSET NHS FOUNDATION TRUST"
    },
    "code":  [
      {
        "coding":  [
          {
            "system": "https://fhir.nhs.uk/R4/CodeSystem/UKCore-SDSJobRoleName",
            "code": "R8000",
            "display": "Clinical Practitioner Access Role"
          }
        ]
      }
    ]
  }
}
const practitioner3 = {
  "fullUrl": "urn:uuid:e6aa1919-1334-4cb2-9024-b3c9bb0415c1",
  "resource": {
    "resourceType": "Practitioner",
    "identifier":  [
      {
        "system": "https://fhir.nhs.uk/Id/sds-user-id",
        "value": "7020134158"
      }
    ],
    "name":  [
      {
        "family": "RAZ",
        "given":  [
          "SAZ"
        ],
        "prefix":  [
          "DR"
        ]
      }
    ]
  }
}

const entries = [
  messageHeader,
  medicationRequest,
  patient,
  practitionerRole,
  practitioner,
  organization,
  practitionerRole2,
  practitioner2,
  organization2,
  practitionerRole3,
  practitioner3
]

export const Bundle = {
  "resourceType": "Bundle",
  "id": "homecare-response",
  "meta": {
    "lastUpdated": "2020-11-02T11:15:30+00:00"
  },
  "identifier": {
    "system": "https://tools.ietf.org/html/rfc4122",
    "value": "658c143d-7e8d-43b7-a8b0-495032e50411"
  },
  "type": "message",
  "timestamp": "2020-11-02T11:16:30+00:00",
  "entry": entries
}

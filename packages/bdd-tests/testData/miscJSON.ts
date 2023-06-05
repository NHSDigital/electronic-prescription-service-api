
export const statusReasonkey = "statusReasonCodeableConcept"
export const healthcareServiceKey = "healthcareService"
export const statusReason = {
  "coding": [
    {
      "code": "0010",
      "system": "https://fhir.nhs.uk/CodeSystem/medicationdispense-status-reason",
      "display": "Patient did not collect medication"
    }
  ]
}

export const extReplacementOf = {
  "extension": [
    {
      "url": "https://fhir.nhs.uk/StructureDefinition/Extension-replacementOf",
      "valueIdentifier": {
        "system": "https://tools.ietf.org/html/rfc4122",
        "value": "2ab19b50-9c91-40ce-b694-792c9c05ce24"
      }
    },
    {
      "url": "https://fhir.nhs.uk/StructureDefinition/Extension-MessageHeader-messageId",
      "valueIdentifier": {
        "system": "https://tools.ietf.org/html/rfc4122",
        "value": "22bec80d-8cc8-41c6-88f7-68a38854438d"
      }
    }
  ]
}

export const endorsement = {
  "url": "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionEndorsement",
  "valueCodeableConcept": {
    "coding": [
      {
        "system": "https://fhir.nhs.uk/CodeSystem/medicationrequest-endorsement",
        "code": "SLS",
        "display": "Selected List Scheme"
      }
    ]
  }
}

export const medicationRepeatInfoPrep = {
  "url": "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation",
  "extension": [
    {
      "url": "numberOfPrescriptionsIssued",
      "valueUnsignedInt": 1
    },
    {
      "url": "authorisationExpiryDate",
      "valueDateTime": "2023-12-07"
    }
  ]
}

export const medicationRepeatInfoPrep1 = {
  "url": "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation",
  "extension": [
    {
      "url": "authorisationExpiryDate",
      "valueDateTime": "2023-12-07"
    }
  ]
}

export const medicationRepeatInfoDisp = {
  "url": "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-RepeatInformation",
  "extension": [
    {
      "url" : "numberOfRepeatsAllowed",
      "valueInteger" : 5
    },
    {
      "url" : "numberOfRepeatsIssued",
      "valueInteger" : 0
    }
  ]
}

export const basedon = {
  "basedOn": [
    {
      "extension": [
        {
          "url": "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-RepeatInformation",
          "extension": [
            {
              "url": "numberOfRepeatsAllowed",
              "valueInteger": 5
            },
            {
              "url": "numberOfRepeatsIssued",
              "valueInteger": 0
            }
          ]
        }
      ],
      "identifier": {
        "system": "https://fhir.nhs.uk/Id/prescription-order-item-number",
        "value": "64f4fceb-ff9c-4b3f-8e9a-95ef781e24a7"
      }
    }
  ]
}

export const healthcareServiceResource = {
  "fullUrl": "urn:uuid:54b0506d-49af-4245-9d40-d7d64902055e",
  "resource": {
    "resourceType": "HealthcareService",
    "id": "54b0506d-49af-4245-9d40-d7d64902055e",
    "identifier": [
      {
        "use": "usual",
        "system": "https://fhir.nhs.uk/Id/ods-organization-code",
        "value": "RRERP"
      }
    ],
    "active": true,
    "providedBy": {
      "identifier": {
        "system": "https://fhir.nhs.uk/Id/ods-organization-code",
        "value": "RRE"
      }
    },
    "location": [
      {
        "reference": "urn:uuid:8a5d7d67-64fb-44ec-9802-2dc214bb3dcb"
      }
    ],
    "name": "PRESCRIBER 240",
    "telecom": [
      {
        "system": "phone",
        "value": "01233123123",
        "use": "work"
      }
    ]
  }
}
export const locationResource = {
  "fullUrl": "urn:uuid:8a5d7d67-64fb-44ec-9802-2dc214bb3dcb",
  "resource": {
    "resourceType": "Location",
    "id": "8a5d7d67-64fb-44ec-9802-2dc214bb3dcb",
    "identifier": [
      {
        "value": "10008800708"
      }
    ],
    "status": "active",
    "mode": "instance",
    "address": {
      "line": [
        "SEVERN FIELDS MEDICAL PRACTICE",
        "SUNDORNE ROAD",
        "SHREWSBURY"
      ],
      "postalCode": "SY1 4RQ"
    }
  }
}

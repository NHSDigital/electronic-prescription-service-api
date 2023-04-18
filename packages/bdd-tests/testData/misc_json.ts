
export const statusReasonkey = "statusReasonCodeableConcept"
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

export const medicationRepeatInfo = {
  "url": "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation",
  "extension": [
    {
      "url": "numberOfPrescriptionsIssued",
      "valueUnsignedInt": 1
    },
    {
      "url": "authorisationExpiryDate",
      "valueDateTime": "2023-04-07"
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
              "valueUnsignedInt": 5
            }
          ]
        }
      ],
      "identifier": {
        "system": "https://fhir.nhs.uk/Id/prescription-order-item-number",
        "value": "299c610b-f4f1-4eac-a7d7-4fb6b0556e11"
      }
    }
  ]
}

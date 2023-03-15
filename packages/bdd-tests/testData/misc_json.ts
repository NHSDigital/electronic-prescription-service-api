
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

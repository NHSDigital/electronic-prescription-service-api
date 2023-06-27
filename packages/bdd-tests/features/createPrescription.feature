Feature: Creating a prescription

  Background:
    Given I am authenticated
    
  Scenario Outline: prepare 1 item from template
    When I prepare 1 prescription(s) for FGC1 with no details
    Then I get a success response 200

  Scenario Outline: prepare 3 item from template
    When I prepare 3 prescription(s) for FGC1 with no details
    Then I get a success response 200

  Scenario Outline: prepare 1 line item prescription with details
    When I prepare 1 prescription(s) for FGC1 with details
      | snomedId   | medItem    | quantity    | dosageInstructions    |
      | <snomedId> | <medItem>  | <quantity>  | <dosageInstructions>  |
    Then I get a success response 200

    Examples:
      | snomedId          | medItem                       | quantity | dosageInstructions        |
      | 322341003         | High-strength Co-codamol 30mg | 20       | 2 times a day for 10 days |
      | 39732311000001104 | Amoxicillin 250mg Capsules    | 22.5     | 1 time a day for 11 days  |

  Scenario Outline: order 1 item from template
    When I prepare 1 prescription(s) for FGC1 with no details
    Then I get a success response 200
    When I sign the prescriptions
    Then I get a success response 200

  Scenario Outline: order 3 item from template
    When I prepare 3 prescription(s) for FGC1 with no details
    Then I get a success response 200
    When I sign the prescriptions
    Then I get a success response 200

  Scenario Outline: Create 1 line item prescription with details
    When I prepare 1 prescription(s) for FGC1 with details
      | snomedId   | medItem    | quantity    | dosageInstructions    |
      | <snomedId> | <medItem>  | <quantity>  | <dosageInstructions>  |
    Then I get a success response 200
    When I sign the prescriptions
    Then I get a success response 200

    Examples:
      | snomedId          | medItem                       | quantity | dosageInstructions        |
      | 322341003         | High-strength Co-codamol 30mg | 20       | 2 times a day for 10 days |
      | 39732311000001104 | Amoxicillin 250mg Capsules    | 22.5     | 1 time a day for 11 days  |


  Scenario: Create 1 line item prescription with details and valid endorsementCode
    When I prepare 1 prescription(s) for FGC1 with details
      | snomedId  | medItem                       | quantity | dosageInstructions        | addResource    | addEndorsementCode | addEndorsementDisplay                       |
      | 322341003 | High-strength Co-codamol 30mg | 20       | 2 times a day for 10 days | addEndorsement | ACBS               | Advisory Committee on Borderline Substances |
    Then I get a success response 200
    When I sign the prescriptions
    Then I get a success response 200

  Scenario: Create 1 line item prescription with details and invalid endorsementCode
    When I prepare 1 prescription(s) for FGC1 with details
      | snomedId  | medItem                       | quantity | dosageInstructions        | addResource    | addEndorsementCode  | addEndorsementDisplay                       |
      | 322341003 | High-strength Co-codamol 30mg | 20       | 2 times a day for 10 days | addEndorsement | ACBSET              | Advisory Committee on Borderline Substances |
    Then I get an error response 400
      | message                                                                                                                                                                                                                                                                                            |
      | None of the codings provided are in the value set https://fhir.nhs.uk/ValueSet/DM-prescription-endorsement (https://fhir.nhs.uk/ValueSet/DM-prescription-endorsement), and a coding from this value set is required) (codes = https://fhir.nhs.uk/CodeSystem/medicationrequest-endorsement#ACBSET) |

  Scenario Outline: Create 1 line item prescription - when missing required info
    When I prepare 1 prescription(s) for FGC1 with details
      | removeBlock   |
      | <removeBlock> |
    Then I get an error response 400
      | message   |
      | <message> |

    Examples:
      | removeBlock         | message                                                                                                                                                         |
      | dosageInstructions  | MedicationRequest.dosageInstruction: minimum required = 1, but only found 0 (from https://fhir.nhs.uk/StructureDefinition/NHSDigital-MedicationRequest-Message) |
      | quantity            | MedicationRequest.dispenseRequest.quantity: minimum required = 1, but only found 0 (from https://fhir.nhs.uk/StructureDefinition/NHSDigital-MedicationRequest-Message) |
      | dm+d                | MedicationRequest.medication[x]: minimum required = 1, but only found 0 (from http://hl7.org/fhir/StructureDefinition/MedicationRequest)                        |

  Scenario Outline: Create line item prescription with additional instructions
    When I prepare 1 prescription(s) for FGC1 with details
      | snomedId   | medItem   | quantity   | dosageInstructions   | addResource    | additionalInstructions |
      | <snomedId> | <medItem> | <quantity> | <dosageInstructions> | <resourceName> | <additionalInstructions>                     |
    Then I get a success response 200
    When I sign the prescriptions
    Then I get a success response 200

    Examples:
      | snomedId          | medItem                       | quantity | dosageInstructions         | resourceName          | additionalInstructions                                |
      | 322341003         | High-strength Co-codamol 30mg | 20       | 2 times a day for 10 days  | communicationRequest  | The surgery is closed for 1 months due to water leak  |
      | 322341003         | High-strength Co-codamol 30mg | 20       | 2 times a day for 10 days  | MedReqNotes           | Dosage has been decreased on advice from the hospital |
      | 12245711000001105 | Methadone 100mg capsules      | 1        | once                       | MedReqNotes           | Prescription Only Medicine                            |

  Scenario: Create a prescription with over 5 line items for a dispensing site - invalid
    Given I prepare 1 prescription(s) for FGG90 with 5 line items
    Then I get an error response 400
      | message                                                                            |
      | Bundle contains too many resources of type MedicationRequest. Expected at most 4.  |
    And prescription not created in spine

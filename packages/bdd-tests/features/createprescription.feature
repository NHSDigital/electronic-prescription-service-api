Feature: Creating a prescription

  Background:
    Given I am authenticated

  @excluded @AEA-3116
  Scenario Outline: Create 1 line item prescription
    When I create 1 prescription(s) for FGC1 with details
      | snomedId   | medItem | quantity | dosageInstructions        |
      | <snomedId> | <medItem>      | <quantity>       | <dosageInstructions> |
    Then I get a success response 200

    Examples:
      | snomedId  | medItem                       | quantity | dosageInstructions        |
      | 322341003 | High-strength Co-codamol 30mg | 20       | 2 times a day for 10 days |
      #| 39732311000001104 | Amoxicillin 250mg Capsules    | 22.5     | 1 time a day for 11 days  |

  @excluded
  Scenario: Create 1 line item prescription with a valid endorsement
    When I create 1 prescription(s) for FGC1 with details
      | snomedId  | medItem                       | quantity | dosageInstructions        | addResource    | addEndorsementCode | addEndorsementDisplay                       |
      | 322341003 | High-strength Co-codamol 30mg | 20       | 2 times a day for 10 days | addEndorsement | ACBS               | Advisory Committee on Borderline Substances |
    Then I get a success response 200

  @excluded
  Scenario: Create 1 line item prescription with an invalid endorsement
    When I prepare 1 prescription(s) for FGC1 with details
      | snomedId  | medItem                       | quantity | dosageInstructions        | addResource | addEndorsementCode | addEndorsementDisplay                       |
      | 322341003 | High-strength Co-codamol 30mg | 20       | 2 times a day for 10 days | addEndorsement | ACBSET             | Advisory Committee on Borderline Substances |
    Then I get an error response 400
      | message                                                                                                    |
      | None of the codings provided are in the value set https://fhir.nhs.uk/ValueSet/DM-prescription-endorsement |


  @excluded
  Scenario Outline: Create 1 line item prescription - when missing required info
    When I prepare 1 prescription(s) for FGC1 with details
      | removeBlock |
      | <removeBlock> |
    Then I get an error response 400
      | message   | issueNo |
      | <message> | <issueNo>      |

    Examples:
      | removeBlock | message | issueNo |
      | dosageInstructions | MedicationRequest.dosageInstruction: minimum required = 1, but only found 0 | 0       |
      | quantity    | MedicationRequest.dispenseRequest.quantity: minimum required = 1, but only found 0 | 2       |
      | dm+d        | MedicationRequest.medication[x]: minimum required = 1, but only found 0 | 0       |

  @AEA-2934 @excluded
  Scenario Outline: Create line item prescription with additional instructions
    When I create 1 prescription(s) for FGC1 with details
      | snomedId   | medItem   | quantity   | dosageInstructions   | addResource    | additionalInstructions |
      | <snomedId> | <medItem> | <quantity> | <dosageInstructions> | <resourceName> | <additionalInstructions>                     |
    Then I get a success response 200

    Examples:
      | snomedId          | medItem                  | quantity | dosageInstructions | resourceName | additionalInstructions                                |
      #| 322341003 | High-strength Co-codamol 30mg | 20       | 2 times a day for 10 days | communicationRequest | The surgery is closed for 1 months due to water leak |
      #| 322341003 | High-strength Co-codamol 30mg | 20       | 2 times a day for 10 days | MedReqNotes  | Dosage has been decreased on advice from the hospital |
      | 12245711000001105 | Methadone 100mg capsules | 1        | once               | MedReqNotes  | Prescription Only Medicine |

  @included
  Scenario: Create a prescription with over 4 line items for a dispensing site - invalid
    Given I prepare 1 prescription(s) for FGG90 with 5 line items
    Then I get an error response 400
      | message |
      | Bundle contains too many resources of type MedicationRequest. Expected at most 4.        |
    And prescription not created in spine

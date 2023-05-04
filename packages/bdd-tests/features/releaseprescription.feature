Feature: Releasing a prescription

  Background:
    Given I am authenticated

  @excluded
  Scenario Outline: Release up to 25 prescriptions for a dispensing site
    Given I create <number> prescription(s) for <dispensing site>
    When I release the prescriptions
    Then I get <number> prescription(s) released to <dispensing site>


    Examples:
      | number | dispensing site |
      | 1      | FCG72           |
   #| 3      | FCG71           |

  @excluded
  Scenario: Release a prescription with multiple line item for a dispensing site
    Given I create 1 prescription(s) for FGG90 with 4 line items
    When I release the prescriptions
    Then I get 1 prescription(s) released to FGG90
    And 4 line items are returned in the response

  @excluded
  Scenario: Release a prescription with an invalid signature
    Given I create 1 prescription(s) for FCG80 with an invalid signature
    When I release the prescriptions
    Then I get no prescription released to FCG80
    And prescription status is To Be Dispensed

  @excluded
  Scenario Outline: Release up to 25 repeat/eRD prescriptions for a dispensing site
    Given I create <number> prescription(s) for <dispensing site>
      | prescriptionType | numberOfRepeatsAllowed   |
      | <prescriptionType> | <numberOfRepeatsAllowed> |
    When I release the prescriptions
    Then I get <number> prescription(s) released to <dispensing site>


    Examples:
      | number | dispensing site | prescriptionType | numberOfRepeatsAllowed |
      | 1      | FCG72           | repeat           | 0                      |
      | 1      | FCG72           | erd              | 5                      |

  @excluded @AEA-2881
  Scenario Outline: Return an acute prescription
    Given I create <number> prescription(s) for <dispensing site>
    When I release the prescriptions
    Then I get <number> prescription(s) released to <dispensing site>
    And the prescription is marked as With Dispenser
    When I return the prescription
      | statusReasonCode | statusReasonDisplay |
      | <statusReasonCode>           | <statusReasonDisplay>     |
    Then I get a success response 200
    Then the prescription is marked as To Be Dispensed


    Examples:
      | number | dispensing site | statusReasonCode | statusReasonDisplay  |
      #| 1      | FCG72           | 0004             | Another dispenser requested release on behalf of the patient |
      | 1      | FCG71           | 0008             | Prescription expired |

  @included @AEA-2881
  Scenario: Return an acute prescription where cancellation is pending
    Given I create 1 prescription(s) for FCG72
    When I release the prescriptions
    And I cancel the prescription
      | statusReasonCode |                        statusReasonDisplay |
      | 0007 | Notification of Death |
    Then I get a success response 200

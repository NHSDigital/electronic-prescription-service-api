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
  Scenario: Release a prescription with over 4 line items for a dispensing site - invalid
    Given I create 1 prescription(s) for FGG90 with 5 line items
    When I release the prescriptions
    Then I get an error response 400
      | message |
      | Bundle contains too many resources of type MedicationRequest. Expected at most 4.        |
    And prescription not created in spine

  @excluded
  Scenario: Release a prescription with an invalid signature
    Given I create 1 prescription(s) for FCG80 with an invalid signature
    When I release the prescriptions
    Then I get no prescription released to FCG80
    And prescription status is To Be Dispensed

  @included
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

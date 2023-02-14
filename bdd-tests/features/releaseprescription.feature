Feature: Releasing a prescription

  Background:
    Given I am authenticated

  @included
  Scenario Outline: Release up to 25 prescriptions for a dispensing site
    Given I create <number> prescription(s) for <dispensing site>
    When I release the prescriptions
    Then I get <number> prescription(s) released to <dispensing site>


    Examples:
      | number | dispensing site |
      | 1      | FCG71           |
  #| 3      | FCG71           |

  @excluded
  Scenario: Release a prescription with an invalid signature
    Given I create 1 prescription(s) for FCG80 with an invalid signature
    When I release the prescriptions
    Then I get no prescription released to FCG80
    And prescription status is To Be Dispensed


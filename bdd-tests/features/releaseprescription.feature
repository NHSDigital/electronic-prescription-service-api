Feature: Releasing a prescription

  Background:
    Given I am authenticated

  Scenario Outline: Release up to 25 prescriptions for a dispensing site
    Given I create <number of prescription(s)>
    When I release the prescriptions
    Then I get <number of prescription(s)>


    Examples:
      | number of prescription(s) |
      | 1                         |
  #| 25                         |

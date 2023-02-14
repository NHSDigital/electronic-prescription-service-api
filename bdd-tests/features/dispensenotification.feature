Feature: Send a dispense notification to EPS

  Background:
    Given I am authenticated

  @included @AEA-2419
  Scenario Outline: Send a dispense notification for an acute prescription
    Given I create <number> prescription(s) for <dispensing site>
    And I release the prescriptions
    And the prescription status is With Dispenser
    When I send a dispense notification with <code> and <dispense type>
    Then the prescription is marked as <type> dispensed

    Examples:
      | number | dispensing site | code | dispense type | type |
#          | 1      | FCG76           | 0001 | Item fully dispensed     | |
      | 1      | FCG76           | 0002 | Item not dispensed       | |
#      | 1      | FCG76           | 0003 | Item dispensed - partial ||
#      | 1      | FCG76           | 0004 | Item not dispensed owing |      |
#      | 1      | FCG76           | 0005 | Item cancelled           | |
#      | 1      | FCG76           | 0006 | Expired                  | |
#      | 1      | FCG76           | 0007 | Item to be dispensed     | |
#      | 1      | FCG76           | 0008 | Item with dispenser      | |

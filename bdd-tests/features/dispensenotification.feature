Feature: Send a dispense notification to EPS

  Background:
    Given I am authenticated

  @excluded @AEA-2419
  Scenario Outline: Send a dispense notification for an acute prescription
    Given I create <number> prescription(s) for <dispensing site>
    And I release the prescriptions
    And the prescription status is With Dispenser
    When I send a dispense notification with <code> and <dispense type>
    Then the prescription is marked as <type> dispensed

    Examples:
      | number | dispensing site | code | dispense type | type |
            | 1      | FCG76           | 0001 | Item fully dispensed     | |
#      | 1      | FCG76           | 0002 | Item not dispensed       | |
  #     | 1      | FCG76           | 0004 | Item not dispensed owing |      |


  @excluded @AEA-2419
  Scenario Outline: Send a dispense notification for an acute prescription - partial dispense
    Given I create <number> prescription(s) for <dispensing site>
    And I release the prescriptions
    And the prescription status is With Dispenser
    When I send a dispense notification with <code> and <dispense type> and <quantity>
    Then the prescription is marked as <type> dispensed
    When I send a dispense notification with <code1> and <dispense type1> and <quantity1>
    Then the prescription is marked as <type1> dispensed

    Examples:
      | number | dispensing site | code | dispense type            | type | quantity | code1 | dispense type1           | type1 | quantity1 |
      #| 1      | FCG76           | 0003 | Item dispensed - partial |      | 100      | 0001  | Item fully dispensed |       | 100       |
      | 1      | FCG76           | 0003 | Item dispensed - partial |      | 100      | 0003  | Item dispensed - partial |       | 50        |
#      | 1      | FCG76           | 0002 | Item not dispensed       | |
#      | 1      | FCG76           | 0003 | Item dispensed - partial ||
  #     | 1      | FCG76           | 0004 | Item not dispensed owing |      |




  #      | 1      | FCG76           | 0005 | Item cancelled |      |  Not valid for acute, can be applied for ERD
#     | 1      | FCG76           | 0006 | Expired                  | |
#      | 1      | FCG76           | 0007 | Item to be dispensed     | |
#      | 1      | FCG76           | 0008 | Item with dispenser      | |

  @included @AEA-2419
  Scenario Outline: Send a dispense notification for an acute prescription with multiple line item with states
    Given I create 1 prescription(s) for FGG90 with 2 line items
    And I release the prescriptions
    When I send a dispense notification for the 2 line items
      | code    | dispenseType     | quantity    |
      | <code>  | <dispense type>  | <quantity>  |
      | <code1> | <dispense type1> | <quantity1> |
    #Then the prescription is marked as <type> dispensed

    Examples:
      | code | dispense type            | quantity | code1 | dispense type1     | quantity1 |
      | 0003 | Item dispensed - partial | 100      | 0002  | Item not dispensed | 60        |


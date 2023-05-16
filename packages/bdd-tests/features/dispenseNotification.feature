Feature: Send a dispense notification to EPS

  Background:
    Given I am authenticated

  @excluded @AEA-2419
  Scenario Outline: Send a dispense notification for an acute prescription
    Given I create <number> prescription(s) for <dispensing site>
    And I release the prescriptions
    And the prescription status is With Dispenser
    When I send a dispense notification
      | code | dispenseType |
      | <code> | <dispense type> |
    Then the prescription is marked as <type> dispensed

    Examples:
      | number | dispensing site | code | dispense type | type |
       #     | 1      | FCG76           | 0001 | Item fully dispensed     | |
      | 1      | FCG76           | 0002 | Item not dispensed       | |
  #     | 1      | FCG76           | 0004 | Item not dispensed owing |      |


  @excluded @AEA-2419
  Scenario Outline: Send a dispense notification for an acute prescription - partial dispense
    Given I create <number> prescription(s) for <dispensing site>
    And I release the prescriptions
    And the prescription status is With Dispenser
    When I send a dispense notification
      | code    | dispenseType     | quantity    |
      | <code> | <dispense type> | <quantity> |
    Then the prescription is marked as <type> dispensed
    When I send a dispense notification
      | code    | dispenseType     | quantity    |
      | <code1> | <dispense type1> | <quantity1> |
    Then the prescription is marked as <type1> dispensed

    Examples:
      | number | dispensing site | code | dispense type | type | quantity | code1 | dispense type1 | type1 | quantity1 |
      | 1      | FCG76           | 0003 | Item dispensed - partial |      | 100      | 0001  | Item fully dispensed |       | 100       |
      #| 1      | FCG76           | 0003 | Item dispensed - partial |      | 100      | 0003  | Item dispensed - partial |       | 50        |





  #      | 1      | FCG76           | 0005 | Item cancelled |      |  Not valid for acute, can be applied for ERD
#     | 1      | FCG76           | 0006 | Expired                  | |
#      | 1      | FCG76           | 0007 | Item to be dispensed     | |
#      | 1      | FCG76           | 0008 | Item with dispenser      | |

  @excluded @AEA-2848
  Scenario Outline: Send a dispense notification for an acute prescription with multiple line items with states
    Given I create 1 prescription(s) for FGG90 with 2 line items
    And I release the prescriptions
    When I send a dispense notification for the 2 line items
      | code    |  | dispenseType     | quantity    | notifyCode   |
      | <code>  |  | <dispense type>  | <quantity>  | <notifyCode> |
      | <code1> |  | <dispense type1> | <quantity1> | <notifyCode> |
    #Then the prescription is marked as <type> dispensed

    Examples:
      | code | dispense type | quantity | code1 | dispense type1 | quantity1 | notifyCode |
      #| 0003 | Item dispensed - partial | 100      | 0002  | Item not dispensed | 60        |0003|
      | 0001 | Item fully dispensed | 200      | 0003  | Item dispensed - partial | 15        | 0003       |
      #| 0001 | Item fully dispensed | 200      | 0002  | Item not dispensed | 60        | 0003       |

  @excluded @AEA-2848
  Scenario: Send a dispense notification for an acute prescription with three line items with states
    Given I create 1 prescription(s) for FGG90 with 3 line items
    And I release the prescriptions
    When I send a dispense notification for the 3 line items
      | code | dispenseType         | quantity | notifyCode |
      | 0001 | Item fully dispensed | 200      | 0001       |
      | 0001 | Item fully dispensed | 60       | 0001       |
      | 0001 | Item fully dispensed | 1        | 0001       |


  @excluded @AEA-2848
  Scenario Outline: Amend a dispense notification for an acute prescription with multiple line items with states
    Given I create 1 prescription(s) for FGG90 with 2 line items
    And I release the prescriptions
    And I send a dispense notification for the 2 line items
      | code    |  | dispenseType     | quantity    | notifyCode   |
      | <code>  |  | <dispense type>  | <quantity>  | <notifyCode> |
      | <code1> |  | <dispense type1> | <quantity1> | <notifyCode> |
    #Then the prescription is marked as <type> dispensed
    When I amend the dispense notification for item 2
      | code | dispenseType   |
      | 0004 | Item not dispensed owing |

    #Then something happens TODO

    Examples:
      | code | dispense type        | quantity | code1 | dispense type1       | quantity1 | notifyCode |
      | 0001 | Item fully dispensed | 200      | 0001  | Item fully dispensed | 60        | 0004       |

  @included @AEA-2884
  Scenario Outline: Withdraw a dispense notification for an acute prescription
    Given I create <number> prescription(s) for <dispensing site>
    And I release the prescriptions
    And the prescription status is With Dispenser
    And I send a dispense notification
      | code | dispenseType |
      | <code> | <dispense type> |
    And the prescription is marked as <type> dispensed
    When I withdraw the dispense notification
      | statusReasonCode | statusReasonDisplay |
      | <statusReasonCode>           | <statusReasonDisplay>     |
    Then I get a success response 200
    Then the prescription is marked as <type> dispensed

    Examples:
      | number | dispensing site | code | dispense type        | type | statusReasonCode | statusReasonDisplay |
      #| 1      | FCG76           | 0001 | Item fully dispensed |      | MU               | Medication Update   |
      | 1      | FCG76           | 0001 | Item fully dispensed |      | DA               | Dosage Amendments   |

  @excluded @AEA-2885
  Scenario Outline: Withdraw a dispense notification for a repeat prescription
    Given I create <number> prescription(s) for <dispensing site>
      | prescriptionType | numberOfRepeatsAllowed   |
      | <prescriptionType> | <numberOfRepeatsAllowed> |
    And I release the prescriptions
    And the prescription status is With Dispenser
    And I send a dispense notification
      | code   | dispenseType    | quantity   |
      | <code> | <dispense type> | <quantity> |
    And the prescription is marked as <type> dispensed
    When I withdraw the dispense notification
      | statusReasonCode | statusReasonDisplay |
      | <statusReasonCode>           | <statusReasonDisplay>     |
    Then I get a success response 200
    Then the prescription is marked as <type> dispensed


    Examples:
      | number | dispensing site | prescriptionType | numberOfRepeatsAllowed | code | dispense type | type | quantity | statusReasonCode | statusReasonDisplay |
      #| 1      | FCG72           | repeat           | 0                      | 0004 | Item not dispensed owing |      | 170      | OC               | Other Clinical      |
      | 1      | FCG72           | repeat           | 0                      | 0003 | Item dispensed - partial |      | 50       | ONC              | Other Non-Clinical  |

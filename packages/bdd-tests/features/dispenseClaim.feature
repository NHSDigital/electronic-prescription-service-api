Feature: Send a dispense claim to EPS

  Background:
    Given I am authenticated

  @excluded @AEA-2888
  Scenario Outline: Send a dispense claim for an acute prescription
    Given I create <number> prescription(s) for <dispensing site>
    And I release the prescriptions
    And the prescription status is With Dispenser
    When I send a dispense notification
      | code   | dispenseType    |
      | <code> | <dispense type> |
    And the prescription is marked as <type> dispensed
    When I send a dispense claim
    Then I get a success response 200

    Examples:
      | number | dispensing site | code | dispense type | type |
      | 1      | FCG76           | 0001 | Item fully dispensed     | |

  @excluded @AEA-2888
  Scenario Outline: Send a dispense claim for an acute prescription with four line items with states
    Given I create 1 prescription(s) for FGG90 with 4 line items
    And I release the prescriptions
    And I send a dispense notification for the 4 line items
      | code | dispenseType         | quantity | notifyCode |
      | 0001 | Item fully dispensed | 200      | 0001       |
      | 0001 | Item fully dispensed | 60       | 0001       |
      | 0001 | Item fully dispensed | 1        | 0001       |
      | 0001 | Item fully dispensed | 28        | 0001       |
    And the prescription is marked as <type> dispensed
    When I send a dispense claim for the 4 line items
      | odsCode   | evidenceSeen   | endorsementCode   | prescriptionCharge   |
      | <odsCode> | <evidenceSeen> | <endorsementCode> | <prescriptionCharge> |
    Then I get a success response 200

  Examples:
    | odsCode | evidenceSeen     | endorsementCode | prescriptionCharge                    |
    | T1450   | no-evidence-seen | NDEC,BB,BB,NDEC | not-paid,paid-once,not-paid,paid-once |

  @excluded @AEA-2888
  Scenario Outline: Amend a dispense claim for an acute prescription with four line items with states
    Given I create 1 prescription(s) for FGG90 with 4 line items
    And I release the prescriptions
    And I send a dispense notification for the 4 line items
      | code | dispenseType         | quantity | notifyCode |
      | 0001 | Item fully dispensed | 200      | 0001       |
      | 0001 | Item fully dispensed | 60       | 0001       |
      | 0001 | Item fully dispensed | 1        | 0001       |
      | 0001 | Item fully dispensed | 28        | 0001       |
    And the prescription is marked as <type> dispensed
    And I send a dispense claim for the 4 line items
      | odsCode   | evidenceSeen   | endorsementCode   | prescriptionCharge   |
      | <odsCode> | <evidenceSeen> | <endorsementCode> | <prescriptionCharge> |
    Then I get a success response 200
    When I amend the dispense claim
      | evidenceSeen    |
      | evidence-seen |
    Then I get a success response 200

    Examples:
      | odsCode | evidenceSeen     | endorsementCode | prescriptionCharge                    |
      | T1450   | no-evidence-seen | NDEC,BB,BB,NDEC | not-paid,paid-once,not-paid,paid-once |

  @excluded @AEA-2888
  Scenario: Send an amend claim for an acute prescription - with claim amend send after 5th day of the following month
    Given I create 1 prescription(s) for HK190
    And I release the prescriptions
    And the prescription status is With Dispenser
    When I send a dispense notification
      | code | dispenseType         |
      | 0001 | Item fully dispensed |
    And the prescription is marked as <type> dispensed
    When I send a dispense claim
      | createdDate              |
      | 2023-02-28T13:30:00.000Z |
    Then I get a success response 200
    When I amend the dispense claim
      | evidenceSeen    |
      | evidence-seen |
    Then I get an error response 400
      | message                                                      | errorObject |
      | Claim amendment is not permitted outside of the claim period | issue       |

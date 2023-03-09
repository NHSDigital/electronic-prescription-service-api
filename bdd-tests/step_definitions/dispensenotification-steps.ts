import instance from '../src/configs/api';
import * as ss from "./shared-steps";
import * as helper from "../util/helper"

import {defineFeature, loadFeature} from "jest-cucumber";
const feature = loadFeature("./features/dispensenotification.feature", {tagFilter: '@included and not @excluded'});

defineFeature(feature, test => {
  let _number
  let _site
  let resp;
  const _code = []
  const _dispenseType = []
  const _quantity = []

    test('Send a dispense notification for an acute prescription', ({ given, and, when, then }) => {

      ss.givenIAmAuthenticated(given)

      ss.givenICreateXPrescriptionsForSite(given)

      ss.whenIReleaseThePrescription(when)

    and('the prescription status is With Dispenser', async() => {

    });

    when(/^I send a dispense notification with (.*) and (.*)$/, async(code, dispenseType) => {
      _code.push(code)
      _dispenseType.push(dispenseType)
      resp = await helper.sendDispenseNotification(_code, _dispenseType, ss._site)
    });

    then(/^the prescription is marked as (.*) dispensed$/, (arg0) => {

    });
  });

  test('Send a dispense notification for an acute prescription - partial dispense', ({ given, and, when, then }) => {
    ss.givenIAmAuthenticated(given)

    ss.givenICreateXPrescriptionsForSite(given)

    ss.whenIReleaseThePrescription(when)

    and('the prescription status is With Dispenser', async() => {

    });

    when(/^I send a dispense notification with (.*) and (.*) and (.*)$/, async(code, dispenseType, quantity) => {
      _code.push(code)
      _dispenseType.push(dispenseType)
      _quantity.push(quantity)
      resp = await helper.sendDispenseNotification(_code, _dispenseType, ss._site, _quantity)
    });

    then(/^the prescription is marked as (.*) dispensed$/, (arg0) => {

    });

    when(/^I send a dispense notification with (.*) and (.*) and (.*)$/, async(code, dispenseType, quantity) => {
      _code.push(code)
      _dispenseType.push(dispenseType)
      _quantity.push(quantity)
      resp = await helper.sendDispenseNotification(_code, _dispenseType, ss._site, _quantity)
    });

    then(/^the prescription is marked as (.*) dispensed$/, (arg0) => {

    });
  });

  test('Send a dispense notification for an acute prescription with multiple line items with states', ({ given, when }) => {
    ss.givenIAmAuthenticated(given)

    ss.givenICreateXPrescriptionsForSiteWithXLineItems(given)

    ss.whenIReleaseThePrescription(when)

    when(/^I send a dispense notification for the (\d+) line items$/, async (medDispNo, table) => {

      table.forEach(row => {
        _code.push(row.code)
        _dispenseType.push(row.dispenseType)
        _quantity.push(row.quantity)
      })

      resp = await helper.sendDispenseNotification(_code, _dispenseType, ss._site, _quantity, medDispNo, table[0].notifyCode)
    });
  });

  test('Send a dispense notification for an acute prescription with three line items with states', ({ given, when }) => {
    ss.givenIAmAuthenticated(given)

    ss.givenICreateXPrescriptionsForSiteWithXLineItems(given)

    ss.whenIReleaseThePrescription(when)

    when(/^I send a dispense notification for the (\d+) line items$/, async (medDispNo, table) => {

      table.forEach(row => {
        _code.push(row.code)
        _dispenseType.push(row.dispenseType)
        _quantity.push(row.quantity)
      })

      resp = await helper.sendDispenseNotification(_code, _dispenseType, ss._site, _quantity, medDispNo, table[0].notifyCode)
    });
  });

  test('Amend a dispense notification for an acute prescription with multiple line items with states', ({ given, when }) => {
    ss.givenIAmAuthenticated(given)

    ss.givenICreateXPrescriptionsForSiteWithXLineItems(given)

    ss.whenIReleaseThePrescription(when)

    when(/^I send a dispense notification for the (\d+) line items$/, async (medDispNo, table) => {

      table.forEach(row => {
        _code.push(row.code)
        _dispenseType.push(row.dispenseType)
        _quantity.push(row.quantity)
      })

      resp = await helper.sendDispenseNotification(_code, _dispenseType, ss._site, _quantity, medDispNo, table[0].notifyCode)
    });

    when(/^I amend the dispense notification for item (\d+)$/, async(itemNo, table) => {
      table.forEach(row => {
        _code.push(row.code)
        _dispenseType.push(row.dispenseType)
        _quantity.push(row.quantity)
      })

      resp = await helper.amendDispenseNotification(itemNo, table[0].code, table[0].dispenseType)
    });
  });




});

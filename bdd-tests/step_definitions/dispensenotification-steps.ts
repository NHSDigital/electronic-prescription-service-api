import instance from '../src/configs/api';
import {givenIAmAuthenticated} from "./shared-steps";
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

    givenIAmAuthenticated(given)
    given(/^I create (.*) prescription\(s\) for (.*)$/, async (number, site) => {
      await helper.createPrescription(number, site)
      _number = number
      _site = site
    });

    and('I release the prescriptions', async () => {
      resp = await helper.releasePrescription(_number, _site)
    });

    and('the prescription status is With Dispenser', async() => {

    });

    when(/^I send a dispense notification with (.*) and (.*)$/, async(code, dispenseType) => {
      _code.push(code)
      _dispenseType.push(dispenseType)
      resp = await helper.sendDispenseNotification(_code, _dispenseType, _site)
    });

    then(/^the prescription is marked as (.*) dispensed$/, (arg0) => {

    });
  });

  test('Send a dispense notification for an acute prescription - partial dispense', ({ given, and, when, then }) => {
    givenIAmAuthenticated(given)
    given(/^I create (.*) prescription\(s\) for (.*)$/, async (number, site) => {
      await helper.createPrescription(number, site)
      _number = number
      _site = site
    });

    and('I release the prescriptions', async () => {
      resp = await helper.releasePrescription(_number, _site)
    });

    and('the prescription status is With Dispenser', async() => {

    });

    when(/^I send a dispense notification with (.*) and (.*) and (.*)$/, async(code, dispenseType, quantity) => {
      _code.push(code)
      _dispenseType.push(dispenseType)
      _quantity.push(quantity)
      resp = await helper.sendDispenseNotification(_code, _dispenseType, _site, _quantity)
    });

    then(/^the prescription is marked as (.*) dispensed$/, (arg0) => {

    });

    when(/^I send a dispense notification with (.*) and (.*) and (.*)$/, async(code, dispenseType, quantity) => {
      _code.push(code)
      _dispenseType.push(dispenseType)
      _quantity.push(quantity)
      resp = await helper.sendDispenseNotification(_code, _dispenseType, _site, _quantity)
    });

    then(/^the prescription is marked as (.*) dispensed$/, (arg0) => {

    });
  });

  test('Send a dispense notification for an acute prescription with multiple line item with states', ({ given, when }) => {
    givenIAmAuthenticated(given)

    given(/^I create (\d+) prescription\(s\) for (.*) with (\d+) line items$/, async (number, site, medReqNo) => {
      await helper.createPrescription(number, site, undefined, medReqNo)
      _number = number
      _site = site
    });

    when('I release the prescriptions', async () => {
      resp = await helper.releasePrescription(_number, _site)
    });

    when(/^I send a dispense notification for the (\d+) line items$/, async (medDispNo, table) => {

      table.forEach(row => {
        _code.push(row.code)
        _dispenseType.push(row.dispenseType)
        _quantity.push(row.quantity)
      })

      resp = await helper.sendDispenseNotification(_code, _dispenseType, _site, _quantity, medDispNo)
    });
  });

});

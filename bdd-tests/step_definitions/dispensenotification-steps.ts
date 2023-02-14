import instance from '../src/configs/api';
import {givenIAmAuthenticated} from "./shared-steps";
import * as helper from "../util/helper"

import {defineFeature, loadFeature} from "jest-cucumber";
const feature = loadFeature("./features/dispensenotification.feature", {tagFilter: '@included and not @excluded'});

defineFeature(feature, test => {
  let _number
  let _site
  let resp;

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
      resp = await helper.sendDispenseNotification(code, dispenseType)
    });

    then(/^the prescription is marked as (.*) dispensed$/, (arg0) => {

    });
  });


});

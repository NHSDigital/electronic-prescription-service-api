import instance from '../src/configs/api';
import * as ss from "./shared-steps";
import * as helper from "../util/helper"

import {defineFeature, loadFeature} from "jest-cucumber";
import {whenISendADispenseNotificationForTheNolineItems} from "./shared-steps";
const feature = loadFeature("./features/dispensenotification.feature", {tagFilter: '@included and not @excluded'});

defineFeature(feature, test => {

  let resp;

    test('Send a dispense notification for an acute prescription', ({ given, and, when, then }) => {

      ss.givenIAmAuthenticated(given)

      ss.givenICreateXPrescriptionsForSite(given)

      ss.whenIReleaseThePrescription(when)

    and('the prescription status is With Dispenser', async() => {

    });

      ss.whenISendADispenseNotification(when)

    then(/^the prescription is marked as (.*) dispensed$/, (arg0) => {

    });
  });

  test('Send a dispense notification for an acute prescription - partial dispense', ({ given, and, when, then }) => {
    ss.givenIAmAuthenticated(given)

    ss.givenICreateXPrescriptionsForSite(given)

    ss.whenIReleaseThePrescription(when)

    and('the prescription status is With Dispenser', async() => {

    });

    ss.whenISendADispenseNotification(when)

    then(/^the prescription is marked as (.*) dispensed$/, (arg0) => {

    });

    ss.whenISendADispenseNotification(when)

    then(/^the prescription is marked as (.*) dispensed$/, (arg0) => {

    });
  });

  test('Send a dispense notification for an acute prescription with multiple line items with states', ({ given, when }) => {
    ss.givenIAmAuthenticated(given)

    ss.givenICreateXPrescriptionsForSiteWithXLineItems(given)

    ss.whenIReleaseThePrescription(when)

    ss.whenISendADispenseNotificationForTheNolineItems(when)
  });

  test('Send a dispense notification for an acute prescription with three line items with states', ({ given, when }) => {
    ss.givenIAmAuthenticated(given)

    ss.givenICreateXPrescriptionsForSiteWithXLineItems(given)

    ss.whenIReleaseThePrescription(when)

    ss.whenISendADispenseNotificationForTheNolineItems(when)
  });

  test('Amend a dispense notification for an acute prescription with multiple line items with states', ({ given, when }) => {
    ss.givenIAmAuthenticated(given)

    ss.givenICreateXPrescriptionsForSiteWithXLineItems(given)

    ss.whenIReleaseThePrescription(when)

    ss.whenISendADispenseNotificationForTheNolineItems(when)

    when(/^I amend the dispense notification for item (\d+)$/, async(itemNo, table) => {
      resp = await helper.amendDispenseNotification(itemNo, table)
    });
  });

});

import instance from '../src/configs/api';
import * as ss from "./sharedSteps";
import * as helper from "../util/helper"

import {defineFeature, loadFeature} from "jest-cucumber";
import {resp, thenIGetASuccessResponse, whenISendADispenseNotificationForTheNolineItems} from "./sharedSteps";
const feature = loadFeature("./features/dispenseNotification.feature", {tagFilter: '@included and not @excluded'});

defineFeature(feature, test => {

  let resp;

    test('Send a dispense notification for an acute prescription', ({ given, and, when, then }) => {

      ss.givenIAmAuthenticated(given)

      ss.givenICreateXPrescriptionsForSite(given)

      ss.whenIReleaseThePrescription(when)

    and('the prescription status is With Dispenser', async() => {
      //TODO
    });

      ss.whenISendADispenseNotification(when)

    then(/^the prescription is marked as (.*) dispensed$/, (arg0) => {
      //TODO
    });
  });

  test('Send a dispense notification for an acute prescription - partial dispense', ({ given, and, when, then }) => {
    ss.givenIAmAuthenticated(given)

    ss.givenICreateXPrescriptionsForSite(given)

    ss.whenIReleaseThePrescription(when)

    and('the prescription status is With Dispenser', async() => {
      //TODO
    });

    ss.whenISendADispenseNotification(when)

    then(/^the prescription is marked as (.*) dispensed$/, (arg0) => {
      //TODO
    });

    ss.whenISendADispenseNotification(when)

    then(/^the prescription is marked as (.*) dispensed$/, (arg0) => {
      //TODO
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

  test('Withdraw a dispense notification for an acute prescription', ({ given, and, when, then }) => {

    ss.givenIAmAuthenticated(given)

    ss.givenICreateXPrescriptionsForSite(given)

    ss.whenIReleaseThePrescription(when)

    and('the prescription status is With Dispenser', async () => {
      //TODO
    })
    ss.whenISendADispenseNotification(when)

    then(/^the prescription is marked as (.*) dispensed$/, (arg0) => {
      //TODO
    })

    when('I withdraw the dispense notification', async (table) => {
      resp = await helper.withdrawDispenseNotification(ss._site, table)
    })

    then(/^I get a success response (\d+)$/, (status) => {
      expect(resp.status).toBe(parseInt(status))
    });

    then(/^the prescription is marked as (.*) dispensed$/, (arg0) => {
      //TODO
    })
  })

  test('Withdraw a dispense notification for a repeat prescription', ({ given, and, when, then }) => {

    ss.givenIAmAuthenticated(given)

    ss.givenICreateXRepeatPrescriptionsForSite(given)

    ss.whenIReleaseThePrescription(when)

    and('the prescription status is With Dispenser', async () => {
      //TODO
    })
    ss.whenISendADispenseNotification(when)

    then(/^the prescription is marked as (.*) dispensed$/, (arg0) => {
      //TODO
    })

    when('I withdraw the dispense notification', async (table) => {
      resp = await helper.withdrawDispenseNotification(ss._site, table)
    })

    then(/^I get a success response (\d+)$/, (status) => {
      expect(resp.status).toBe(parseInt(status))
    });

    then(/^the prescription is marked as (.*) dispensed$/, (arg0) => {
      //TODO
    })
  })

})

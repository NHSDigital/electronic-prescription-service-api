import * as ss from "./shared-steps";
import * as helper from "../util/helper"

import {defineFeature, loadFeature} from "jest-cucumber";
const feature = loadFeature("./features/createprescription.feature", {tagFilter: '@included and not @excluded'});

defineFeature(feature, test => {

  test('Create 1 line item prescription', ({ given, when, then }) => {
    ss.givenIAmAuthenticated(given)

    ss.givenICreateXPrescriptionsForSiteWithDetails(when)

    ss.thenIGetASuccessResponse(then)
  });

  test('Create 1 line item prescription with a valid endorsement', ({ given, when, then }) => {
    ss.givenIAmAuthenticated(given)

    ss.givenICreateXPrescriptionsForSiteWithDetails(when)

    ss.thenIGetASuccessResponse(then)
  });

  test('Create 1 line item prescription with an invalid endorsement', ({ given, when, then }) => {
    ss.givenIAmAuthenticated(given)

    ss.whenIPrepareXPrescriptionsForSiteWithDetails(when)

    then(/^I get an error response (\d+)$/, (status, table) => {
      expect(ss.resp[0].status).toBe(parseInt(status))
      expect(ss.resp[0].data.issue[0].diagnostics).toMatch(table[0].message)
    });
  });

  test('Create 1 line item prescription - when missing required info', ({ given, when, then }) => {
    ss.givenIAmAuthenticated(given)

    ss.whenIPrepareXPrescriptionsForSiteWithDetails(when)

    then(/^I get an error response (\d+)$/, (status, table) => {
      let issueNo = table[0].issueNo
      expect(ss.resp[0].status).toBe(parseInt(status))
      expect(ss.resp[0].data.issue[issueNo].diagnostics).toMatch(table[0].message)
    });
  });

  test('Create line item prescription with additional instructions', ({ given, when, then }) => {
    ss.givenIAmAuthenticated(given)

    ss.givenICreateXPrescriptionsForSiteWithDetails(when)

    ss.thenIGetASuccessResponse(then)
  });



})

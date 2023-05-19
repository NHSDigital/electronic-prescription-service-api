import * as ss from "./sharedSteps"

import {defineFeature, loadFeature} from "jest-cucumber"
const feature = loadFeature("./features/dispenseClaim.feature", {tagFilter: "@included and not @excluded"})

defineFeature(feature, test => {

  test("Send a dispense claim for an acute prescription", ({given, and, when, then}) => {

    ss.givenIAmAuthenticated(given)

    ss.givenICreateXPrescriptionsForSite(given)

    ss.whenIReleaseThePrescription(when)

    ss.thePrescriptionStatusIsWithDispenser(and)

    ss.whenISendADispenseNotification(when)

    ss.thePrescriptionIsMarkedAsDispensed(then)

    ss.whenISendADispenseClaim(when, false)

    ss.thenIGetASuccessResponse(then)
  })

  test("Send a dispense claim for an acute prescription with four line items with states", ({given, when, then}) => {
    ss.givenIAmAuthenticated(given)

    ss.givenICreateXPrescriptionsForSiteWithXLineItems(given)

    ss.whenIReleaseThePrescription(when)

    ss.whenISendADispenseNotificationForTheNolineItems(when)

    ss.thePrescriptionIsMarkedAsDispensed(then)

    ss.whenISendADispenseClaimForTheNolineItems(when)

    ss.thenIGetASuccessResponse(then)
  })

  test("Amend a dispense claim for an acute prescription with four line items with states", ({given, when, then}) => {
    ss.givenIAmAuthenticated(given)

    ss.givenICreateXPrescriptionsForSiteWithXLineItems(given)

    ss.whenIReleaseThePrescription(when)

    ss.whenISendADispenseNotificationForTheNolineItems(when)

    ss.thePrescriptionIsMarkedAsDispensed(then)

    ss.whenISendADispenseClaimForTheNolineItems(when)
    ss.thenIGetASuccessResponse(then)
    ss.whenIAmendTheDispenseClaim(when)
    ss.thenIGetASuccessResponse(then)
  })

  test("Send an amend claim for an acute prescription - with claim amend send after 5th day of the following month",
    ({given, and, when, then}) => {

      ss.givenIAmAuthenticated(given)

      ss.givenICreateXPrescriptionsForSite(given)

      ss.whenIReleaseThePrescription(when)

      ss.thePrescriptionStatusIsWithDispenser(and)

      ss.whenISendADispenseNotification(when)

      ss.thePrescriptionIsMarkedAsDispensed(then)

      ss.whenISendADispenseClaim(when, true)

      ss.thenIGetASuccessResponse(then)

      ss.whenIAmendTheDispenseClaim(when)

      ss.thenIGetAnErrorResponse(then)
    })

})

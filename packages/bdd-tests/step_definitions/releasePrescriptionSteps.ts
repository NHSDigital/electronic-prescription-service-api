import {defineFeature, loadFeature} from "jest-cucumber"
import * as ss from "./sharedSteps"

const feature = loadFeature("./features/releasePrescription.feature", {tagFilter: "@included and not @excluded"})
defineFeature(feature, test => {

  test("Release up to 25 prescriptions for a dispensing site", ({given, when, then}) => {

    ss.givenIAmAuthenticated(given)

    ss.givenICreateXPrescriptionsForSite(given)

    ss.whenIReleaseThePrescription(when)

    ss.thenIGetASuccessResponse(then)

    ss.thenIGetPrescriptionsReleasedToSite(then)

  })
  test("Release a prescription with an invalid signature", ({given, when, then, and}) => {
    ss.givenIAmAuthenticated(given)

    ss.givenICreateXPrescriptionsForSiteWithAnInvalidSignature(given)

    ss.whenIReleaseThePrescription(when)

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    then(/^I get no prescription released to (.*)$/, site => {
      expect(ss.resp.data.parameter[0].resource.entry[1].resource.issue[0].details.coding[0].code).toBe("INVALID_VALUE")
      expect(ss.resp.data.parameter[0].resource.entry[1].resource.issue[0].details.coding[0].display)
        .toBe("Signature is invalid.")
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    and(/^prescription status is (.*)$/, status => {
      //TODO
    })
  })

  test("Release a prescription with multiple line item for a dispensing site", ({given, when, then, and}) => {
    ss.givenIAmAuthenticated(given)

    ss.givenICreateXPrescriptionsForSiteWithXLineItems(given)

    ss.whenIReleaseThePrescription(when)

    then(/^I get (\d+) prescription\(s\) released to (.*)$/, (_number, _site) => {
      const passedPrescriptionResourceEntry = ss.resp.data.parameter[0].resource.entry[0].resource
      expect(passedPrescriptionResourceEntry.entry[0].resource.destination[0].receiver.identifier.value)
        .toBe(_site)
      expect(passedPrescriptionResourceEntry.entry[1].resource.resourceType).toBe("MedicationRequest")
      expect(passedPrescriptionResourceEntry.entry[1].resource.medicationCodeableConcept.coding[0].display)
        .toBe("Salbutamol 100micrograms/dose inhaler CFC free")
      expect(passedPrescriptionResourceEntry.entry[1].resource.dispenseRequest.quantity.value).toEqual(200)
      expect(passedPrescriptionResourceEntry.entry[2].resource.medicationCodeableConcept.coding[0].display)
        .toBe("Paracetamol 500mg soluble tablets")
      expect(passedPrescriptionResourceEntry.entry[2].resource.dispenseRequest.quantity.value).toEqual(60)
      expect(passedPrescriptionResourceEntry.entry[3].resource.medicationCodeableConcept.coding[0].display)
        .toBe("Methotrexate 10mg/0.2ml solution for injection pre-filled syringes")
      expect(passedPrescriptionResourceEntry.entry[3].resource.dispenseRequest.quantity.value).toEqual(1)
      expect(passedPrescriptionResourceEntry.entry[4].resource.medicationCodeableConcept.coding[0].display)
        .toBe("Flucloxacillin 500mg capsules")
      expect(passedPrescriptionResourceEntry.entry[4].resource.dispenseRequest.quantity.value).toEqual(28)
      expect(passedPrescriptionResourceEntry.entry[5].resource.resourceType).toBe("Patient")
      expect(passedPrescriptionResourceEntry.entry[5].resource.identifier[0].value).toBe("9449304130")

    })

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    and(/^(\d+) line items are returned in the response$/, number => {
      //TODO
    })
  })

  test("Release up to 25 repeat/eRD prescriptions for a dispensing site", ({given, when, then}) => {

    ss.givenIAmAuthenticated(given)

    ss.givenICreateXRepeatPrescriptionsForSite(given)

    ss.whenIReleaseThePrescription(when)

    ss.thenIGetPrescriptionsReleasedToSite(then)

  })

  test("Return an acute prescription", ({given, when, then}) => {
    ss.givenIAmAuthenticated(given)

    ss.givenICreateXPrescriptionsForSite(given)

    ss.whenIReleaseThePrescription(when)

    ss.theIGetPrescriptionReleased(then)

    ss.thePrescriptionIsMarkedAs(then)

    ss.whenIReturnThePrescription(when)

    ss.thenIGetASuccessResponse(then)

    ss.thePrescriptionIsMarkedAs(then)
  })

  test("Return an acute prescription where cancellation is pending", ({given, when, then, and}) => {
    ss.givenIAmAuthenticated(given)

    ss.givenICreateXPrescriptionsForSite(given)

    ss.whenIReleaseThePrescription(when)

    ss.andICancelThePrescription(and)

    ss.thenIGetAnErrorResponse(then)

    ss.whenIReturnThePrescription(when)

    ss.thenIGetASuccessResponse(then)

    ss.thePrescriptionIsMarkedAs(then)
  })

  test("Return a repeat prescription", ({given, when, then}) => {
    ss.givenIAmAuthenticated(given)

    ss.givenICreateXRepeatPrescriptionsForSite(given)

    ss.whenIReleaseThePrescription(when)

    ss.theIGetPrescriptionReleased(then)

    ss.thePrescriptionIsMarkedAs(then)

    ss.whenIReturnThePrescription(when)

    ss.thenIGetASuccessResponse(then)

    ss.thePrescriptionIsMarkedAs(then)
  })

  test("Return a repeat prescription where cancellation is pending", ({given, when, then, and}) => {
    ss.givenIAmAuthenticated(given)

    ss.givenICreateXRepeatPrescriptionsForSite(given)

    ss.whenIReleaseThePrescription(when)

    ss.andICancelThePrescription(and)

    ss.thenIGetAnErrorResponse(then)

    ss.whenIReturnThePrescription(when)

    ss.thenIGetASuccessResponse(then)

    ss.thePrescriptionIsMarkedAs(then)
  })

})

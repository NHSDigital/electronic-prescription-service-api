import {defineFeature, loadFeature} from "jest-cucumber";
import * as ss from "./shared-steps";
import {thenIGetASuccessResponse, thenIGetPrescriptionsReleasedToSite,
} from "./shared-steps";
import * as helper from "../util/helper";
const feature = loadFeature("./features/releaseprescription.feature", {tagFilter: '@included and not @excluded'});
defineFeature(feature, test => {

  let resp;
  test("Release up to 25 prescriptions for a dispensing site", ({given, when, then}) => {

    ss.givenIAmAuthenticated(given)

    ss.givenICreateXPrescriptionsForSite(given)

    ss.whenIReleaseThePrescription(when)

    thenIGetPrescriptionsReleasedToSite(then)

  })
  test("Release a prescription with an invalid signature", ({given, when, then, and}) => {
    ss.givenIAmAuthenticated(given)

    ss.givenICreateXPrescriptionsForSiteWithAnInvalidSignature(given)

    ss.whenIReleaseThePrescription(when)

    then(/^I get no prescription released to (.*)$/, (site) => {
      expect(ss.resp.data.parameter[0].resource.entry[1].resource.issue[0].details.coding[0].code).toBe("INVALID_VALUE")
      expect(ss.resp.data.parameter[0].resource.entry[1].resource.issue[0].details.coding[0].display).toBe("Signature is invalid.")
    });

    and(/^prescription status is (.*)$/, (status) => {
      //TODO
    });
  });

  test('Release a prescription with multiple line item for a dispensing site', ({given, when, then, and}) => {
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

    });

    and(/^(\d+) line items are returned in the response$/, (arg0) => {
      //TODO
    });
  });

  test("Release up to 25 repeat/eRD prescriptions for a dispensing site", ({given, when, then}) => {

    ss.givenIAmAuthenticated(given)

    ss.givenICreateXRepeatPrescriptionsForSite(given)

    ss.whenIReleaseThePrescription(when)

    thenIGetPrescriptionsReleasedToSite(then)

  })

  test('Return an acute prescription', ({given, when, then, and}) => {
    ss.givenIAmAuthenticated(given)

    ss.givenICreateXPrescriptionsForSite(given)

    ss.whenIReleaseThePrescription(when)

    then(/^I get (.*) prescription\(s\) released to (.*)$/, (number, site) => {
      expect(ss.resp.data.parameter[0].resource.entry[0].resource.entry[0].resource.destination[0].receiver.identifier.value)
        .toBe(ss._site)
    })

    ss.thePrescriptionIsMarkedAs(then)

    ss.whenIReturnThePrescription(when)

    thenIGetASuccessResponse(then)

    ss.thePrescriptionIsMarkedAs(then)
  })

  test('Return an acute prescription where cancellation is pending', ({given, when, then, and}) => {
    ss.givenIAmAuthenticated(given)

    ss.givenICreateXPrescriptionsForSite(given)

    ss.whenIReleaseThePrescription(when)

    and('I cancel the prescription', async (table) => {
      resp = await helper.cancelPrescription(table)
    })

    then(/^I get an error response (\d+)$/, (status, table) => {
      expect(resp.status).toBe(parseInt(status))
      expect(resp.data.entry[1].resource.extension[0].extension[0].valueCoding.display).toMatch(table[0].message)
    });

    ss.whenIReturnThePrescription(when)

    thenIGetASuccessResponse(then)

    ss.thePrescriptionIsMarkedAs(then)
  })

})

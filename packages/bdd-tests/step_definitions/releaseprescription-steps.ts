import {defineFeature, loadFeature} from "jest-cucumber"
import * as ss from "./shared-steps"
import * as helper from "../util/helper"

const feature = loadFeature("./features/releaseprescription.feature", {tagFilter: '@included and not @excluded'})

defineFeature(feature, test => {

  let resp;
  test("Release up to 25 prescriptions for a dispensing site", ({given, when, then}) => {

    ss.givenIAmAuthenticated(given)

    ss.givenICreateXPrescriptionsForSite(given)

    ss.whenIReleaseThePrescription(when)

    then(/^I get (.*) prescription\(s\) released to (.*)$/, (number, site) => {
      //expect(resp.data.parameter[0].resource.type).toBe("collection")
      //expect(resp.data.parameter[0].resource.entry[2]).toEqual(1)
      expect(ss.resp.data.parameter[0].resource.entry[0].resource.entry[0].resource.destination[0].receiver.identifier.value)
        .toBe(ss._site)
      expect(ss.resp.data.parameter[0].resource.entry[0].resource.entry[1].resource.resourceType).toBe("MedicationRequest")
      expect(ss.resp.data.parameter[0].resource.entry[0].resource.entry[1].resource.medicationCodeableConcept.coding[0].display)
        .toBe("Salbutamol 100micrograms/dose inhaler CFC free")
      expect(ss.resp.data.parameter[0].resource.entry[0].resource.entry[1].resource.dispenseRequest.quantity.value).toEqual(200)
      expect(ss.resp.data.parameter[0].resource.entry[0].resource.entry[2].resource.resourceType).toBe("Patient")
      expect(ss.resp.data.parameter[0].resource.entry[0].resource.entry[2].resource.identifier[0].value).toBe("9449304130")

    });
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
      expect(ss.resp.data.parameter[0].resource.entry[0].resource.entry[0].resource.destination[0].receiver.identifier.value)
        .toBe(_site)
      expect(ss.resp.data.parameter[0].resource.entry[0].resource.entry[1].resource.resourceType).toBe("MedicationRequest")
      expect(ss.resp.data.parameter[0].resource.entry[0].resource.entry[1].resource.medicationCodeableConcept.coding[0].display)
        .toBe("Salbutamol 100micrograms/dose inhaler CFC free")
      expect(ss.resp.data.parameter[0].resource.entry[0].resource.entry[1].resource.dispenseRequest.quantity.value).toEqual(200)
      expect(ss.resp.data.parameter[0].resource.entry[0].resource.entry[2].resource.medicationCodeableConcept.coding[0].display)
        .toBe("Paracetamol 500mg soluble tablets")
      expect(ss.resp.data.parameter[0].resource.entry[0].resource.entry[2].resource.dispenseRequest.quantity.value).toEqual(60)
      expect(ss.resp.data.parameter[0].resource.entry[0].resource.entry[3].resource.medicationCodeableConcept.coding[0].display)
        .toBe("Methotrexate 10mg/0.2ml solution for injection pre-filled syringes")
      expect(ss.resp.data.parameter[0].resource.entry[0].resource.entry[3].resource.dispenseRequest.quantity.value).toEqual(1)
      expect(ss.resp.data.parameter[0].resource.entry[0].resource.entry[4].resource.medicationCodeableConcept.coding[0].display)
        .toBe("Flucloxacillin 500mg capsules")
      expect(ss.resp.data.parameter[0].resource.entry[0].resource.entry[4].resource.dispenseRequest.quantity.value).toEqual(28)
      expect(ss.resp.data.parameter[0].resource.entry[0].resource.entry[5].resource.resourceType).toBe("Patient")
      expect(ss.resp.data.parameter[0].resource.entry[0].resource.entry[5].resource.identifier[0].value).toBe("9449304130")

    });

    and(/^(\d+) line items are returned in the response$/, (arg0) => {
      //TODO
    });
  });

  test("Release up to 25 repeat/eRD prescriptions for a dispensing site", ({given, when, then}) => {

    ss.givenIAmAuthenticated(given)

    ss.givenICreateXRepeatPrescriptionsForSite(given)

    ss.whenIReleaseThePrescription(when)

    then(/^I get (.*) prescription\(s\) released to (.*)$/, (number, site) => {
      //expect(resp.data.parameter[0].resource.type).toBe("collection")
      //expect(resp.data.parameter[0].resource.entry[2]).toEqual(1)
      expect(ss.resp.data.parameter[0].resource.entry[0].resource.entry[0].resource.destination[0].receiver.identifier.value)
        .toBe(ss._site)
      expect(ss.resp.data.parameter[0].resource.entry[0].resource.entry[1].resource.resourceType).toBe("MedicationRequest")
      expect(ss.resp.data.parameter[0].resource.entry[0].resource.entry[1].resource.medicationCodeableConcept.coding[0].display)
        .toBe("Salbutamol 100micrograms/dose inhaler CFC free")
      expect(ss.resp.data.parameter[0].resource.entry[0].resource.entry[1].resource.dispenseRequest.quantity.value).toEqual(200)
      expect(ss.resp.data.parameter[0].resource.entry[0].resource.entry[2].resource.resourceType).toBe("Patient")
      expect(ss.resp.data.parameter[0].resource.entry[0].resource.entry[2].resource.identifier[0].value).toBe("9449304130")

    })
  })
})

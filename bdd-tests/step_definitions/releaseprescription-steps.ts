import * as helper from "../util/helper"
import fs from 'fs';

import {defineFeature, loadFeature} from "jest-cucumber";
import {givenIAmAuthenticated} from "./shared-steps";
const feature = loadFeature("./features/releaseprescription.feature", {tagFilter: '@included and not @excluded'});

defineFeature(feature, test => {

  let _number
  let _site
  let resp;


  test("Release up to 25 prescriptions for a dispensing site", ({ given, when, then }) => {

    //let req = new Req();

    let createdJWT = "";
    let token;


    givenIAmAuthenticated(given)


    given(/^I create (.*) prescription\(s\) for (.*)$/, async(number, site) => {
      await helper.createPrescription(number, site)
      _number = number
      _site = site
    });

    when('I release the prescriptions', async () => {
      resp = await helper.releasePrescription(_number, _site)
    });

    then(/^I get (.*) prescription\(s\) released to (.*)$/,  (number, site) => {
      //expect(resp.data.parameter[1].resource.type).toBe("collection")
      //expect(resp.data.parameter[1].resource.entry[2]).toEqual(1)
      expect(resp.data.parameter[1].resource.entry[1].resource.entry[0].resource.destination[0].receiver.identifier.value)
        .toBe(_site)
      expect(resp.data.parameter[1].resource.entry[1].resource.entry[1].resource.resourceType).toBe("MedicationRequest")
      expect(resp.data.parameter[1].resource.entry[1].resource.entry[1].resource.medicationCodeableConcept.coding[0].display)
        .toBe("Salbutamol 100micrograms/dose inhaler CFC free")
      expect(resp.data.parameter[1].resource.entry[1].resource.entry[1].resource.dispenseRequest.quantity.value).toEqual(200)
      expect(resp.data.parameter[1].resource.entry[1].resource.entry[2].resource.resourceType).toBe("Patient")
      expect(resp.data.parameter[1].resource.entry[1].resource.entry[2].resource.identifier[0].value).toBe("9449304130")

    });
  })
  test("Release a prescription with an invalid signature", ({ given, when, then, and }) => {
    givenIAmAuthenticated(given)

    given(/^I create (\d+) prescription\(s\) for (.*) with an invalid signature$/, async(number, site) => {
      await helper.createPrescription(number, site, false)
        _number = number
        _site = site
    });

    when('I release the prescriptions', async () => {
      resp = await helper.releasePrescription(_number, _site)
    });

    then(/^I get no prescription released to (.*)$/, (site) => {
      expect(resp.data.parameter[1].resource.entry[0].resource.issue[0].details.coding[0].code).toBe("INVALID_VALUE")
      expect(resp.data.parameter[1].resource.entry[0].resource.issue[0].details.coding[0].display).toBe("Signature is invalid.")
    });

    and(/^prescription status is (.*)$/, (status) => {

    });
  });

  test('Release a prescription with multiple line item for a dispensing site', ({ given, when, then, and }) => {
    givenIAmAuthenticated(given)

    given(/^I create (\d+) prescription\(s\) for (.*) with (\d+) line items$/, async (number, site, medReqNo) => {
      await helper.createPrescription(number, site, undefined, medReqNo)
      _number = number
      _site = site

    });

    when('I release the prescriptions', async () => {
      resp = await helper.releasePrescription(_number, _site)
    });

    then(/^I get (\d+) prescription\(s\) released to (.*)$/, (_number, _site) => {
      expect(resp.data.parameter[1].resource.entry[1].resource.entry[0].resource.destination[0].receiver.identifier.value)
        .toBe(_site)
      expect(resp.data.parameter[1].resource.entry[1].resource.entry[1].resource.resourceType).toBe("MedicationRequest")
      expect(resp.data.parameter[1].resource.entry[1].resource.entry[1].resource.medicationCodeableConcept.coding[0].display)
        .toBe("Salbutamol 100micrograms/dose inhaler CFC free")
      expect(resp.data.parameter[1].resource.entry[1].resource.entry[1].resource.dispenseRequest.quantity.value).toEqual(200)
      expect(resp.data.parameter[1].resource.entry[1].resource.entry[2].resource.medicationCodeableConcept.coding[0].display)
        .toBe("Paracetamol 500mg soluble tablets")
      expect(resp.data.parameter[1].resource.entry[1].resource.entry[2].resource.dispenseRequest.quantity.value).toEqual(60)
      expect(resp.data.parameter[1].resource.entry[1].resource.entry[3].resource.medicationCodeableConcept.coding[0].display)
        .toBe("Methotrexate 10mg/0.2ml solution for injection pre-filled syringes")
      expect(resp.data.parameter[1].resource.entry[1].resource.entry[3].resource.dispenseRequest.quantity.value).toEqual(1)
      expect(resp.data.parameter[1].resource.entry[1].resource.entry[4].resource.resourceType).toBe("Patient")
      expect(resp.data.parameter[1].resource.entry[1].resource.entry[4].resource.identifier[0].value).toBe("9449304130")

    });

    and(/^(\d+) line items are returned in the response$/, (arg0) => {

    });
  });

});

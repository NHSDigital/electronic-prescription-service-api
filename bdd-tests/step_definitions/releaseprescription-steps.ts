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
      await helper.releasePrescription(_number, _site)
    });

    then(/^I get (.*) prescription\(s\) released to (.*)$/,  (number, site) => {
      // expect(releaseData.parameter[0].resource.type).toBe("collection")
      // expect(releaseData.parameter[0].resource.total).toEqual(1)
    });
  })
  test("Release a prescription with an invalid signature", ({ given, when, then, and }) => {
    givenIAmAuthenticated(given)

    given(/^I create (\d+) prescription\(s\) for (.*) with an invalid signature$/, async(number, site) => {
      await helper.createPrescription(number, site, false)
        _number = number
        _site = site
    });

    when('I release the prescriptions', async() => {
      resp = await helper.releasePrescription(_number, _site)
    });

    then(/^I get no prescription released to (.*)$/, (site) => {
      expect(resp.parameter[1].resource.entry[0].resource.issue[0].details.coding[0].code).toBe("INVALID_VALUE")
      expect(resp.parameter[1].resource.entry[0].resource.issue[0].details.coding[0].display).toBe("Signature is invalid.")
    });

    and(/^prescription status is (.*)$/, (status) => {

    });
  });

});

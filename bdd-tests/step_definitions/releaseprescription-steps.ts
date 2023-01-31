import {Req}  from '../src/configs/spec'
import instance from '../src/configs/api';
let accessToken = require("../services/getaccessToken")
let jwt = require("../services/getJWT")
const fs = require('fs');

let { defineFeature, loadFeature } = require("jest-cucumber");
const feature = loadFeature("./features/releaseprescription.feature");

defineFeature(feature, test => {
  test("Release up to 25 prescriptions for a dispensing site", ({ given, when, then }) => {

    //let req = new Req();
    let releaseData;
    let createdJWT = "";
    let token;

    given(/^I am authenticated$/, async function () {
      token = await accessToken.getToken(process.env.userId1)
      console.log(token)
      instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;



    });
    given(/^I create (.*)$/, async function () {
      const data  = require('../pacts/eps_prepare.json');
      const resp = await Req().post(`${process.env.eps_path}/FHIR/R4/$prepare`, data)
       // .then(response => response.data).catch(error => console.log( error.response.data))
      console.log(resp.statusText + resp.data)
      console.log(resp.data.parameter[0].valueString)
      const digest = resp.data.parameter[0].valueString

      createdJWT = jwt.getJWT(digest)
      console.log(createdJWT)
      const signature = await jwt.getSignature(createdJWT, token)
      console.log(signature);


      // const data  = require('../pacts/eps_process_prepare.json');
      // const resp = await Req().post(`${process.env.eps_path}/FHIR/R4/$process-message#prescription-order`, data)
      // console.log(resp.data);
     });
    when(/^I release the prescriptions$/, async function () {
      // const data  = require('../pacts/eps_release.json');
      // const resp = await req.post(`${process.env.eps_path}/FHIR/R4/Task/$release`, data)
      // console.log(resp)
      // releaseData = resp.data;

    });
    then(/^I get (.*)$/, function () {
      // expect(releaseData.parameter[0].resource.type).toBe("collection")
      // expect(releaseData.parameter[0].resource.total).toEqual(1)
    });
  });
});

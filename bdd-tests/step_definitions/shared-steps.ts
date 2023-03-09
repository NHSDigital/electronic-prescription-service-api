import { getToken } from "../services/getaccessToken";
import instance from "../src/configs/api";
import * as helper from "../util/helper";

export let _number
export let _site
export let resp;

export const givenIAmAuthenticated = (given) => {
  given('I am authenticated', async() => {
    const token = await getToken(process.env.userId1)
    console.log(token)
    instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  });
};


export const givenICreateXPrescriptionsForSite = (given) => {
  given(/^I create (.*) prescription\(s\) for (.*)$/, async (number, site) => {
    await helper.createPrescription(number, site)
    _number = number
    _site = site
  });
}


export const whenIReleaseThePrescription = (when) => {
  when('I release the prescriptions', async () => {
    resp = await helper.releasePrescription(_number, _site)
  });
}
export const givenICreateXPrescriptionsForSiteWithAnInvalidSignature = (given) => {
  given(/^I create (\d+) prescription\(s\) for (.*) with an invalid signature$/, async (number, site) => {
    await helper.createPrescription(number, site, false)
    _number = number
    _site = site
  });
}
export const givenICreateXPrescriptionsForSiteWithXLineItems = (given) => {
  given(/^I create (\d+) prescription\(s\) for (.*) with (\d+) line items$/, async (number, site, medReqNo) => {
    await helper.createPrescription(number, site, undefined, medReqNo)
    _number = number
    _site = site
  });
}

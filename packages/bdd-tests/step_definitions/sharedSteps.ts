import {getAuthToken} from "../services/getaccessToken"
import instance from "../src/configs/api"
import * as helper from "../util/helper"
import {When, Then, Given} from "@cucumber/cucumber"
import {expect} from "expect"

export let _number
export let _site
export let resp

let identifierValue

Given("I am authenticated", async () => {
  const token = await getAuthToken()
  instance.defaults.headers.common["Authorization"] = `Bearer ${token}`
})

Given(/^I create (.*) a single prescription\(s\) for (.*)$/, async (number, site) => {
  _number = number
  _site = site
  await helper.createPrescription(number, site)
})

Given(/^I create (.*) prescription\(s\) for (.*) with no details$/, async (number, site, table) => {
  _number = number
  _site = site
  await helper.createPrescription(number, site, undefined, table)
})

Given(/^I create (.*) prescription\(s\) for (.*) with details$/, async (number, site, table) => {
  _number = number
  _site = site
  resp = await helper.createPrescription(number, site, 1, table)
})

When(/^I prepare (.*) prescription\(s\) for (.*) with details$/, async (number, site, table) => {
  resp = await helper.preparePrescription(number, site, 1, table)
})

When("I release the prescriptions", async () => {
  resp = await helper.releasePrescription(_number, _site)
  if (_number === 1 && resp.status === 200) {
    identifierValue = resp.data.parameter[0].resource.identifier.value
  }
})

Given(/^I create (\d+) prescription\(s\) for (.*) with an invalid signature$/, async (number, site) => {
  await helper.createPrescription(number, site, undefined, undefined, false)
  _number = number
  _site = site
})

Given(/^I create (\d+) prescription\(s\) for (.*) with (\d+) line items$/, async (number, site, medReqNo) => {
  await helper.createPrescription(number, site, medReqNo)
  _number = number
  _site = site
})

Given(/^I prepare (\d+) prescription\(s\) for (.*) with (\d+) line items$/, async (number, site, medReqNo) => {
  resp = await helper.preparePrescription(number, site, medReqNo)
})

Then(/^I get a success response (\d+)$/, (status) => {
  expect(resp.status).toBe(parseInt(status))
})

Then(/^I get an error response (\d+)$/, (status, table) => {
  expect(resp.status).toBe(parseInt(status))
  if (table[0].errorObject === "issue") {
    expect(resp.data.issue[0].details.coding[0].display).toMatch(table[0].message)
  } else if (table[0].errorObject === "entry") {
    expect(resp.data.entry[1].resource.extension[0].extension[0].valueCoding.display).toMatch(table[0].message)
  }
})

When(/^I amend the dispense claim$/, async (table) => {
  resp = await helper.amendDispenseClaim(table)
})

When("I send a dispense claim", async (table) => {
  if (table.rows.length > 0) {
    resp = await helper.sendDispenseClaim(_site, 1, table)
  } else {
    resp = await helper.sendDispenseClaim(_site)
  }
})

When(/^I send a dispense claim for the (\d+) line items$/, async (claimNo, table) => {
  resp = await helper.sendDispenseClaim(_site, claimNo, table)
})

When("I send a dispense notification", async (table) => {
  resp = await helper.sendDispenseNotification(_site, 1, table)
})

When(/^I send a dispense notification for the (\d+) line items$/, async (medDispNo, table) => {
  resp = await helper.sendDispenseNotification(_site, medDispNo, table)
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
Then(/^the prescription is marked as (.*)$/, (status) => {
  //TODO
})

When("I return the prescription", async (table) => {
  resp = await helper.returnPrescription(_site, identifierValue, table)
})

Then(/^I get prescription\(s\) released$/, (table) => {
  const passedPrescriptionResourceEntry = resp.data.parameter[0].resource.entry[0].resource
  expect(passedPrescriptionResourceEntry.entry[0].resource.destination[0].receiver.identifier.value).toBe(table[0].site)
  expect(passedPrescriptionResourceEntry.entry[1].resource.resourceType).toBe("MedicationRequest")
  expect(passedPrescriptionResourceEntry.entry[1].resource.medicationCodeableConcept.coding[0].display).toBe(
    table[0].medicationDisplay
  )
  expect(passedPrescriptionResourceEntry.entry[1].resource.dispenseRequest.quantity.value).toEqual(200)
  expect(passedPrescriptionResourceEntry.entry[2].resource.resourceType).toBe("Patient")
  expect(passedPrescriptionResourceEntry.entry[2].resource.identifier[0].value).toBe("9449304130")
})

When("I cancel the prescription", async (table) => {
  resp = await helper.cancelPrescription(table)
})

Then(/^I get (.*) prescription\(s\) released to (.*)$/, (number, site) => {
  expect(resp.data.parameter[0].resource.entry[0].resource.entry[0].resource.destination[0].receiver.identifier.value).toBe(site)
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
Then(/^the prescription is marked as (.*) dispensed$/, (status) => {
  //TODO
})

When("the prescription status is With Dispenser", async () => {
  //TODO
})

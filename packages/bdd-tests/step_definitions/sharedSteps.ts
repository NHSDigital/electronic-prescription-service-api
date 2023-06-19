import {getAuthToken} from "../services/getaccessToken"
import instance from "../src/configs/api"
import * as helper from "../util/helper"
import {When, Then, Given} from "@cucumber/cucumber"
import {expect} from "expect"

Given("I am authenticated", async () => {
  const token = await getAuthToken()
  instance.defaults.headers.common["Authorization"] = `Bearer ${token}`
})

When(/^I prepare (.*) prescription\(s\) for (.*) with details$/, async function (number, site, table) {
  await helper.preparePrescription(number, site, 1, table, this)
  this.resp = this.prepareResponse
})

When(/^I create (.*) prescription\(s\) for (.*) with details$/, async function (number, site, table) {
  await helper.createPrescription(number, site, 1, table, true, this)
  this.resp = this.createResponse
})

When("I release the prescriptions", async function () {
  this.resp = await helper.releasePrescription(this._number, this._site, this)
  if (this._number === 1 && this.resp.status === 200) {
    this.identifierValue = this.resp.data.parameter[0].resource.identifier.value
  }
})

Given(/^I create (\d+) prescription\(s\) for (.*) with an invalid signature$/, async function (number, site) {
  await helper.createPrescription(number, site, undefined, undefined, false, this)
  this._number = number
  this._site = site
})

Given(/^I create (\d+) prescription\(s\) for (.*) with (\d+) line items$/, async function (number, site, medReqNo) {
  await helper.createPrescription(number, site, medReqNo, undefined, undefined, this)
  this._number = number
  this._site = site
})

Given(/^I prepare (\d+) prescription\(s\) for (.*) with (\d+) line items$/, async function (number, site, medReqNo) {
  this.resp = await helper.preparePrescription(number, site, medReqNo, undefined, this)
})

Then(/^I get a success response (\d+)$/, function (status) {
  expect(this.resp.length).toBeGreaterThan(0)
  this.resp.forEach((resp) => {
    expect(resp.status).toBe(parseInt(status))
  })
})

Then(/^I get an error response (\d+)$/, function (status, table) {
  expect(this.resp.length).toBeGreaterThan(0)
  this.resp.forEach((resp) => {
    expect(resp.status).toBe(parseInt(status))
    if (Object.prototype.hasOwnProperty.call(table.hashes()[0], "message")) {
      expect(resp.data.issue[0].diagnostics).toBe(table.hashes()[0].message)
    } else if (table[0].errorObject === "issue") {
      expect(resp.data.issue[0].details.coding[0].display).toMatch(table[0].message)
    } else if (table[0].errorObject === "entry") {
      expect(resp.data.entry[1].resource.extension[0].extension[0].valueCoding.display).toMatch(table[0].message)
    }
  })
})

When(/^I amend the dispense claim$/, async function (table) {
  this.resp = await helper.amendDispenseClaim(table, this)
})

When("I send a dispense claim", async function (table) {
  if (table.rows.length > 0) {
    this.resp = await helper.sendDispenseClaim(this._site, 1, table, this)
  } else {
    this.resp = await helper.sendDispenseClaim(this._site, undefined, undefined, this)
  }
})

When(/^I send a dispense claim for the (\d+) line items$/, async function (claimNo, table) {
  this.resp = await helper.sendDispenseClaim(this._site, claimNo, table, this)
})

When("I send a dispense notification", async function (table) {
  this.resp = await helper.sendDispenseNotification(this._site, 1, table, this)
})

When(/^I send a dispense notification for the (\d+) line items$/, async function (medDispNo, table) {
  this.resp = await helper.sendDispenseNotification(this._site, medDispNo, table, this)
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
Then(/^the prescription is marked as (.*)$/, (status) => {
  //TODO
})

When("I return the prescription", async function (table) {
  this.resp = await helper.returnPrescription(this._site, this.identifierValue, table, this)
})

Then(/^I get prescription\(s\) released$/, function (table) {
  const passedPrescriptionResourceEntry = this.resp.data.parameter[0].resource.entry[0].resource
  expect(passedPrescriptionResourceEntry.entry[0].resource.destination[0].receiver.identifier.value).toBe(table[0].site)
  expect(passedPrescriptionResourceEntry.entry[1].resource.resourceType).toBe("MedicationRequest")
  expect(passedPrescriptionResourceEntry.entry[1].resource.medicationCodeableConcept.coding[0].display).toBe(
    table[0].medicationDisplay
  )
  expect(passedPrescriptionResourceEntry.entry[1].resource.dispenseRequest.quantity.value).toEqual(200)
  expect(passedPrescriptionResourceEntry.entry[2].resource.resourceType).toBe("Patient")
  expect(passedPrescriptionResourceEntry.entry[2].resource.identifier[0].value).toBe("9449304130")
})

When("I cancel the prescription", async function (table) {
  this.resp = await helper.cancelPrescription(table, this)
})

Then(/^I get (.*) prescription\(s\) released to (.*)$/, function (number, site) {
  expect(this.resp.data.parameter[0].resource.entry[0].resource.entry[0].resource.destination[0].receiver.identifier.value).toBe(
    site
  )
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
Then(/^the prescription is marked as (.*) dispensed$/, (status) => {
  //TODO
})

When("the prescription status is With Dispenser", async () => {
  //TODO
})

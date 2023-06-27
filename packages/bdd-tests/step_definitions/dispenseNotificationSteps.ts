import * as helper from "../util/helper"

import {When} from "@cucumber/cucumber"

When(/^I amend the dispense notification for item (\d+)$/, async function (itemNo, table) {
  this.resp = await helper.amendDispenseNotification(itemNo, table, this)
})

When("I withdraw the dispense notification", async function (table) {
  this.resp = await helper.withdrawDispenseNotification(this._site, table, this)
})

When("I withdraw the dispense notification", async function (table) {
  this.resp = await helper.withdrawDispenseNotification(this._site, table, this)
})

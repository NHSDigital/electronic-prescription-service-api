import * as ss from "./sharedSteps"
import * as helper from "../util/helper"

import {When} from "@cucumber/cucumber"

When(/^I amend the dispense notification for item (\d+)$/, async (itemNo, table) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const resp = await helper.amendDispenseNotification(itemNo, table)
})

When("I withdraw the dispense notification", async (table) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const resp = await helper.withdrawDispenseNotification(ss._site, table)
})

When("I withdraw the dispense notification", async (table) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const resp = await helper.withdrawDispenseNotification(ss._site, table)
})

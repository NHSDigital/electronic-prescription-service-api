import * as ss from "./sharedSteps"

import {Then} from "@cucumber/cucumber"

Then(/^I get an error response (\d+)$/, (status, table) => {
  expect(ss.resp[0].status).toBe(parseInt(status))
  expect(ss.resp[0].data.issue[0].diagnostics).toMatch(table[0].message)
})

Then(/^I get an error response (\d+)$/, (status, table) => {
  const issueNo = table[0].issueNo
  expect(ss.resp[0].status).toBe(parseInt(status))
  expect(ss.resp[0].data.issue[issueNo].diagnostics).toMatch(table[0].message)
})

Then(/^I get an error response (\d+)$/, (status, table) => {
  expect(ss.resp[0].status).toBe(parseInt(status))
  expect(ss.resp[0].data.issue[0].diagnostics).toBe(table[0].message)
})

Then("prescription not created in spine", () => {
  //TODO
})

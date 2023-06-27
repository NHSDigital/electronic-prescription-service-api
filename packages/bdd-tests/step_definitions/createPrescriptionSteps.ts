import {Then} from "@cucumber/cucumber"

Then(/^IGNORE I get an error response (\d+)$/, function (status, table) {
  expect(this.resp.status).toBe(parseInt(status))
  expect(this.resp.data.issue[0].diagnostics).toMatch(table[0].message)
})

Then(/^IGNORE I get an error response (\d+)$/, function (status, table) {
  const issueNo = table[0].issueNo
  expect(this.resp.status).toBe(parseInt(status))
  expect(this.resp.data.issue[issueNo].diagnostics).toMatch(table[0].message)
})

Then(/^IGNORE I get an error response (\d+)$/, function (status, table) {
  expect(this.resp.status).toBe(parseInt(status))
  expect(this.resp.data.issue[0].diagnostics).toBe(table[0].message)
})

Then("prescription not created in spine", () => {
  //TODO
})

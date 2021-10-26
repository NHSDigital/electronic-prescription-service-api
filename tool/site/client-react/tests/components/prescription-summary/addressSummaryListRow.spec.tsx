import {render, unmountComponentAtNode} from "react-dom"
import {act} from "react-dom/test-utils"
import {AddressSummaryListRow} from "../../../src/components/prescription-summary/addressSummaryListRow"
import {Address} from "fhir/r4"
import * as React from "react"

let container: HTMLDivElement = null
beforeEach(() => {
  container = document.createElement("div")
  document.body.appendChild(container)
})

afterEach(() => {
  unmountComponentAtNode(container)
  container.remove()
  container = null
})

test("Renders an address with all fields", async () => {
  const testAddress: Address = {
    line: ["Line 1", "Line 2"],
    city: "City",
    district: "District",
    state: "State",
    postalCode: "Postal Code",
    country: "Country"
  }

  await act(async () => {
    render(<AddressSummaryListRow address={testAddress}/>, container)
  })

  const addressKey = document.querySelector(".nhsuk-summary-list__key").innerHTML
  expect(addressKey).toEqual("Address")
  const addressValue = document.querySelector(".nhsuk-summary-list__value").innerHTML
  expect(addressValue).toEqual("Line 1<br>Line 2<br>City<br>District<br>State<br>Postal Code<br>Country")
})

test("Renders an address with no fields", async () => {
  const testAddress: Address = {}

  await act(async () => {
    render(<AddressSummaryListRow address={testAddress}/>, container)
  })

  const addressKey = document.querySelector(".nhsuk-summary-list__key").innerHTML
  expect(addressKey).toEqual("Address")
  const addressValue = document.querySelector(".nhsuk-summary-list__value").innerHTML
  expect(addressValue).toEqual("")
})

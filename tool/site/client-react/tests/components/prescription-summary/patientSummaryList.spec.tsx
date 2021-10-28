import {render, unmountComponentAtNode} from "react-dom"
import {act} from "react-dom/test-utils"
import * as React from "react"
import {PatientSummaryList} from "../../../src/components/prescription-summary/patientSummaryList"
import {getSummaryListKeyValueMap} from "./htmlElementUtils"

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

test("Renders correctly (multiple address fields)", async () => {
  await act(async () => {
    render(
      <PatientSummaryList
        name="CORY, ETTA (MISS)"
        nhsNumber="9990548609"
        dateOfBirth="01-Jan-1999"
        gender="Female"
        addressLines={["1 Trevelyan Square", "Boar Lane", "Leeds", "West Yorkshire", "LS1 6AE"]}
      />,
      container
    )
  })

  const summaryMap = getSummaryListKeyValueMap(container)
  expect(summaryMap).toEqual({
    "Name": "CORY, ETTA (MISS)",
    "NHS Number": "9990548609",
    "Date of Birth": "01-Jan-1999",
    "Gender": "Female",
    "Address": "1 Trevelyan Square<br>Boar Lane<br>Leeds<br>West Yorkshire<br>LS1 6AE"
  })
})

test("Renders correctly (no address fields)", async () => {
  await act(async () => {
    render(
      <PatientSummaryList
        name="CORY, ETTA (MISS)"
        nhsNumber="9990548609"
        dateOfBirth="01-Jan-1999"
        gender="Female"
        addressLines={[]}
      />,
      container
    )
  })

  const summaryMap = getSummaryListKeyValueMap(container)
  expect(summaryMap).toMatchObject({
    "Name": "CORY, ETTA (MISS)",
    "NHS Number": "9990548609",
    "Date of Birth": "01-Jan-1999",
    "Gender": "Female",
    "Address": ""
  })
})

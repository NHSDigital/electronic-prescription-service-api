import {render, unmountComponentAtNode} from "react-dom"
import {act} from "react-dom/test-utils"
import * as React from "react"
import PatientSummaryList from "../../../src/components/prescription-summary/patientSummaryList"
import pretty from "pretty"
import {summaryPatient} from "./props"

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

test("Renders correctly", async () => {
  const component = <PatientSummaryList {...summaryPatient}/>
  await act(async () => render(component, container))
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

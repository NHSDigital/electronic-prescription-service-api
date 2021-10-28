import * as React from "react"
import PrescriptionSummaryView from "../../../src/components/prescription-summary/prescriptionSummaryView"
import {summaryPatient, summaryPractitionerRole, summaryPrescription} from "./props"
import {act} from "react-dom/test-utils"
import {render, unmountComponentAtNode} from "react-dom"
import pretty from "pretty"

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
  const component = <PrescriptionSummaryView {...summaryPrescription}/>
  await act(async () => render(component, container))
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

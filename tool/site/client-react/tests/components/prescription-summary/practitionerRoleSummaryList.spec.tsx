import {render, unmountComponentAtNode} from "react-dom"
import {act} from "react-dom/test-utils"
import * as React from "react"
import PractitionerRoleSummaryList from "../../../src/components/prescription-summary/practitionerRoleSummaryList"
import pretty from "pretty"
import {summaryPractitionerRole} from "./props"

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
  const component = <PractitionerRoleSummaryList {...summaryPractitionerRole}/>
  await act(async () => render(component, container))
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

import * as React from "react"
import {render} from "@testing-library/react"
import pretty from "pretty"
import MedicationSummary from "../../../src/components/prescription-summary/medicationSummary"
import {summaryMedication} from "./props"

test("Renders correctly", async () => {
  const component = <MedicationSummary medicationSummaryList={[summaryMedication]}/>
  const {container} = render(component)
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

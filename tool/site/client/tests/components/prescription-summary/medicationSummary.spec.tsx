import * as React from "react"
import {render} from "@testing-library/react"
import pretty from "pretty"
import {MedicationSummaryTable} from "../../../src/components/prescription/fragments/MedicationSummaryTable"
import {summaryMedication} from "./props"

test("Renders correctly", async () => {
  const component = <MedicationSummaryTable medicationSummaryList={[summaryMedication]}/>
  const {container} = render(component)
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

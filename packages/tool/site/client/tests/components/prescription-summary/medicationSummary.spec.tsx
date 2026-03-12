import * as React from "react"
import {render} from "@testing-library/react"
import {MedicationSummaryTable} from "../../../src/components/prescription-summary/fragments/MedicationSummaryTable"
import {summaryMedication} from "./props"

test("Renders correctly", async () => {
  const component = <MedicationSummaryTable medicationSummaryList={[summaryMedication]}/>
  const {container} = render(component)
  expect(container.innerHTML).toMatchSnapshot()
})

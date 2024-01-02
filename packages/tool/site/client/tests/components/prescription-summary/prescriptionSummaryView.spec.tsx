import * as React from "react"
import {PrescriptionSummaryView} from "../../../src/components/prescription-summary/PrescriptionSummaryView"
import {summaryPrescription} from "./props"
import pretty from "pretty"
import {render} from "@testing-library/react"

test.skip("Renders correctly", async () => {
  const component = <PrescriptionSummaryView {...summaryPrescription}/>
  const {container} = render(component)
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})

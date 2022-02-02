import * as React from "react"
import PatientSummaryList from "../../../src/components/prescription-summary/patientSummaryList"
import pretty from "pretty"
import {summaryPatient} from "./props"
import {render} from "@testing-library/react"

test("Renders correctly", async () => {
  const component = <PatientSummaryList {...summaryPatient}/>
  const {container} = render(component)
  expect(pretty(container.innerHTML)).toMatchSnapshot()
})
